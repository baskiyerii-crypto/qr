import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateFeedbackInput } from '@qr/shared';
import { FeedbackThreadType, UserRole } from '@prisma/client';

@Injectable()
export class FeedbackService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async create(userId: string, role: UserRole, companyId: string | null, resellerId: string | null, dto: CreateFeedbackInput) {
    if (role === UserRole.RESELLER && resellerId) {
      const thread = await this.prisma.feedbackThread.create({
        data: {
          type: FeedbackThreadType.RESELLER_PLATFORM,
          subject: dto.subject,
          resellerId,
          createdByUserId: userId,
          messages: { create: { senderUserId: userId, body: dto.body } },
        },
        include: { messages: true, createdBy: { select: { firstName: true, lastName: true, publicId: true } } },
      });

      const admins = await this.prisma.user.findMany({
        where: { role: UserRole.SUPER_ADMIN, isActive: true },
      });
      for (const admin of admins) {
        await this.notifications.notifyUserOptional(
          null,
          admin.id,
          'Bayi Geri Bildirimi',
          dto.subject,
          'FEEDBACK',
          { threadId: thread.id },
        );
      }
      return thread;
    }

    if (role === UserRole.EMPLOYEE && companyId) {
      const employee = await this.prisma.employee.findFirst({
        where: { userId, companyId },
        include: { manager: { include: { user: true } } },
      });
      if (!employee) throw new NotFoundException('Personel kaydı bulunamadı');

      const thread = await this.prisma.feedbackThread.create({
        data: {
          type: FeedbackThreadType.COMPANY_INTERNAL,
          subject: dto.subject,
          companyId,
          createdByUserId: userId,
          messages: { create: { senderUserId: userId, body: dto.body } },
        },
        include: { messages: true },
      });

      const managerUserId = employee.manager?.userId;
      if (managerUserId) {
        await this.notifications.notifyUser(
          companyId,
          managerUserId,
          'Geri Bildirim',
          dto.subject,
          'FEEDBACK',
          { threadId: thread.id },
        );
      } else {
        const fallback = await this.prisma.user.findFirst({
          where: {
            companyId,
            role: { in: [UserRole.BRANCH_MANAGER, UserRole.HR_MANAGER, UserRole.COMPANY_ADMIN] },
            isActive: true,
          },
          orderBy: { role: 'asc' },
        });
        if (fallback) {
          await this.notifications.notifyUser(companyId, fallback.id, 'Geri Bildirim', dto.subject, 'FEEDBACK', { threadId: thread.id });
        }
      }
      return thread;
    }

    throw new ForbiddenException('Geri bildirim oluşturma yetkiniz yok');
  }

  async listMy(userId: string, role: UserRole, companyId: string | null, resellerId: string | null) {
    if (role === UserRole.SUPER_ADMIN) {
      return this.prisma.feedbackThread.findMany({
        where: { type: FeedbackThreadType.RESELLER_PLATFORM },
        include: {
          messages: { orderBy: { createdAt: 'asc' }, include: { sender: { select: { firstName: true, lastName: true, publicId: true, role: true } } } },
          createdBy: { select: { firstName: true, lastName: true, publicId: true } },
          reseller: { select: { companyName: true, code: true } },
        },
        orderBy: { updatedAt: 'desc' },
      });
    }

    if (role === UserRole.RESELLER && resellerId) {
      return this.prisma.feedbackThread.findMany({
        where: { resellerId },
        include: {
          messages: { orderBy: { createdAt: 'asc' }, include: { sender: { select: { firstName: true, lastName: true, publicId: true } } } },
        },
        orderBy: { updatedAt: 'desc' },
      });
    }

    const employee = companyId
      ? await this.prisma.employee.findFirst({ where: { userId, companyId } })
      : null;

    if (role === UserRole.EMPLOYEE && employee) {
      return this.prisma.feedbackThread.findMany({
        where: { createdByUserId: userId },
        include: {
          messages: { orderBy: { createdAt: 'asc' }, include: { sender: { select: { firstName: true, lastName: true, publicId: true } } } },
          createdBy: { select: { firstName: true, lastName: true, publicId: true, role: true } },
        },
        orderBy: { updatedAt: 'desc' },
      });
    }

    if (companyId) {
      return this.prisma.feedbackThread.findMany({
        where: { companyId, type: FeedbackThreadType.COMPANY_INTERNAL },
        include: {
          messages: { orderBy: { createdAt: 'asc' }, include: { sender: { select: { firstName: true, lastName: true, publicId: true } } } },
          createdBy: { select: { firstName: true, lastName: true, publicId: true, role: true } },
        },
        orderBy: { updatedAt: 'desc' },
      });
    }

    return [];
  }

  async reply(threadId: string, userId: string, body: string) {
    const thread = await this.prisma.feedbackThread.findUnique({
      where: { id: threadId },
      include: { createdBy: true },
    });
    if (!thread) throw new NotFoundException('Konu bulunamadı');

    const message = await this.prisma.feedbackMessage.create({
      data: { threadId, senderUserId: userId, body },
    });

    await this.prisma.feedbackThread.update({
      where: { id: threadId },
      data: { status: 'ANSWERED', updatedAt: new Date() },
    });

    if (thread.createdByUserId !== userId) {
      const creatorEmployee = await this.prisma.employee.findFirst({
        where: { userId: thread.createdByUserId },
      });
      if (thread.companyId) {
        if (creatorEmployee) {
          await this.notifications.notifyEmployee(thread.companyId, creatorEmployee.id, 'Geri Bildirim Yanıtı', thread.subject, 'FEEDBACK_REPLY', { threadId });
        } else {
          await this.notifications.notifyUser(thread.companyId, thread.createdByUserId, 'Geri Bildirim Yanıtı', thread.subject, 'FEEDBACK_REPLY', { threadId });
        }
      } else {
        await this.notifications.notifyUserOptional(null, thread.createdByUserId, 'Platform Yanıtı', thread.subject, 'FEEDBACK_REPLY', { threadId });
      }
    }

    return message;
  }

  async close(threadId: string, userId: string) {
    const thread = await this.prisma.feedbackThread.findUnique({ where: { id: threadId } });
    if (!thread) throw new NotFoundException('Konu bulunamadı');
    return this.prisma.feedbackThread.update({
      where: { id: threadId },
      data: { status: 'CLOSED' },
    });
  }
}
