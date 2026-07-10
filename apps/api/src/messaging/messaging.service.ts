import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageInput, CreateConversationInput, AddGroupMembersInput } from '@qr/shared';
import { ConversationType, UserRole } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { MessagingScopeService } from './messaging-scope.service';
import { JwtPayload } from '../common/decorators';

@Injectable()
export class MessagingService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private scope: MessagingScopeService,
  ) {}

  async send(
    companyId: string,
    user: JwtPayload,
    dto: SendMessageInput,
  ) {
    const senderUserId = user.role === UserRole.EMPLOYEE ? null : user.sub;
    const senderEmployeeId = user.employeeId;

    if (dto.conversationId) {
      await this.scope.assertConversationAccess(dto.conversationId, user, companyId);
      const message = await this.sendToConversation(
        dto.conversationId,
        senderUserId,
        senderEmployeeId,
        dto.body,
      );
      await this.notifyConversationParticipants(companyId, dto.conversationId, user, dto.body);
      return message;
    }

    if (dto.broadcast && dto.employeeIds?.length) {
      if (!this.scope.canStartConversation(user)) {
        throw new ForbiddenException('Personel toplu mesaj gönderemez');
      }
      const conversations = [];
      for (const employeeId of dto.employeeIds) {
        await this.scope.assertCanMessageEmployee(companyId, user, employeeId);
        const conv = await this.prisma.conversation.create({
          data: {
            companyId,
            type: ConversationType.BROADCAST,
            subject: dto.body.substring(0, 50),
            createdByUserId: user.sub,
            participants: { create: [{ employeeId }] },
            messages: {
              create: { senderUserId, body: dto.body },
            },
          },
        });
        await this.notifications.notifyEmployee(
          companyId,
          employeeId,
          'Yeni Mesaj',
          dto.body.substring(0, 100),
          'MESSAGE',
          { conversationId: conv.id },
        );
        conversations.push(conv);
      }
      return conversations;
    }

    if (dto.recipientEmployeeId) {
      if (!this.scope.canStartConversation(user)) {
        throw new ForbiddenException('Personel yeni konuşma başlatamaz');
      }
      await this.scope.assertCanMessageEmployee(companyId, user, dto.recipientEmployeeId);

      let conversation = await this.prisma.conversation.findFirst({
        where: {
          companyId,
          type: ConversationType.DIRECT,
          participants: { some: { employeeId: dto.recipientEmployeeId } },
        },
      });

      if (!conversation) {
        conversation = await this.prisma.conversation.create({
          data: {
            companyId,
            type: ConversationType.DIRECT,
            createdByUserId: user.sub,
            participants: {
              create: [{ employeeId: dto.recipientEmployeeId }, { userId: user.sub }],
            },
          },
        });
      }

      const message = await this.sendToConversation(
        conversation.id,
        senderUserId,
        senderEmployeeId,
        dto.body,
      );

      await this.notifications.notifyEmployee(
        companyId,
        dto.recipientEmployeeId,
        'Yeni Mesaj',
        dto.body.substring(0, 100),
        'MESSAGE',
        { conversationId: conversation.id },
      );

      return message;
    }

    throw new BadRequestException('Geçersiz mesaj parametreleri');
  }

  async createConversation(companyId: string, user: JwtPayload, dto: CreateConversationInput) {
    if (dto.type === 'DIRECT') {
      if (!this.scope.canStartConversation(user)) {
        throw new ForbiddenException('Personel yeni konuşma başlatamaz');
      }
      await this.scope.assertCanMessageEmployee(companyId, user, dto.recipientEmployeeId);

      let conversation = await this.prisma.conversation.findFirst({
        where: {
          companyId,
          type: ConversationType.DIRECT,
          participants: { some: { employeeId: dto.recipientEmployeeId } },
        },
        include: {
          participants: {
            include: {
              employee: { include: { user: { select: { firstName: true, lastName: true } } } },
            },
          },
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      });

      if (!conversation) {
        conversation = await this.prisma.conversation.create({
          data: {
            companyId,
            type: ConversationType.DIRECT,
            createdByUserId: user.sub,
            participants: {
              create: [{ employeeId: dto.recipientEmployeeId }, { userId: user.sub }],
            },
          },
          include: {
            participants: {
              include: {
                employee: { include: { user: { select: { firstName: true, lastName: true } } } },
              },
            },
            messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        });
      }

      if (dto.body) {
        await this.sendToConversation(conversation.id, user.sub, user.employeeId, dto.body);
        await this.notifications.notifyEmployee(
          companyId,
          dto.recipientEmployeeId,
          'Yeni Mesaj',
          dto.body.substring(0, 100),
          'MESSAGE',
          { conversationId: conversation.id },
        );
      }

      return conversation;
    }

    const memberEmployeeIds = dto.memberEmployeeIds;
    const memberUserIds = [...(dto.memberUserIds ?? []), user.sub];
    await this.scope.assertCanAddGroupMembers(companyId, user, memberEmployeeIds, memberUserIds);

    const participants = [
      ...memberEmployeeIds.map((employeeId) => ({ employeeId })),
      ...[...new Set(memberUserIds)].map((userId) => ({ userId })),
    ];

    const conversation = await this.prisma.conversation.create({
      data: {
        companyId,
        type: ConversationType.GROUP,
        name: dto.name,
        createdByUserId: user.sub,
        participants: { create: participants },
        messages: dto.body
          ? { create: { senderUserId: user.sub, senderEmployeeId: user.employeeId, body: dto.body } }
          : undefined,
      },
      include: {
        participants: {
          include: {
            employee: { include: { user: { select: { firstName: true, lastName: true } } } },
            user: { select: { firstName: true, lastName: true } },
          },
        },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    for (const empId of memberEmployeeIds) {
      await this.notifications.notifyEmployee(
        companyId,
        empId,
        'Yeni Grup',
        dto.name,
        'GROUP_MESSAGE',
        { conversationId: conversation.id },
      );
    }

    return conversation;
  }

  async addGroupMembers(
    companyId: string,
    user: JwtPayload,
    conversationId: string,
    dto: AddGroupMembersInput,
  ) {
    await this.scope.assertConversationAccess(conversationId, user, companyId);

    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, companyId, type: ConversationType.GROUP },
    });
    if (!conversation) throw new NotFoundException('Grup bulunamadı');

    const employeeIds = dto.memberEmployeeIds ?? [];
    const userIds = dto.memberUserIds ?? [];
    await this.scope.assertCanAddGroupMembers(companyId, user, employeeIds, userIds);

    for (const employeeId of employeeIds) {
      await this.prisma.conversationParticipant.upsert({
        where: { conversationId_employeeId: { conversationId, employeeId } },
        create: { conversationId, employeeId },
        update: {},
      });
      await this.notifications.notifyEmployee(
        companyId,
        employeeId,
        'Gruba Eklendiniz',
        conversation.name ?? 'Grup',
        'GROUP_MESSAGE',
        { conversationId },
      );
    }

    for (const userId of userIds) {
      await this.prisma.conversationParticipant.upsert({
        where: { conversationId_userId: { conversationId, userId } },
        create: { conversationId, userId },
        update: {},
      });
    }

    return this.getConversation(conversationId);
  }

  async markRead(conversationId: string, user: JwtPayload) {
    if (user.employeeId) {
      await this.prisma.conversationParticipant.updateMany({
        where: { conversationId, employeeId: user.employeeId },
        data: { lastReadAt: new Date() },
      });
    } else {
      await this.prisma.conversationParticipant.updateMany({
        where: { conversationId, userId: user.sub },
        data: { lastReadAt: new Date() },
      });
    }
    return { ok: true };
  }

  private async sendToConversation(
    conversationId: string,
    senderUserId: string | null,
    senderEmployeeId: string | null,
    body: string,
  ) {
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
    return this.prisma.message.create({
      data: { conversationId, senderUserId, senderEmployeeId, body },
    });
  }

  private async notifyConversationParticipants(
    companyId: string,
    conversationId: string,
    sender: JwtPayload,
    body: string,
  ) {
    const participants = await this.prisma.conversationParticipant.findMany({
      where: { conversationId },
    });

    for (const p of participants) {
      if (p.employeeId && p.employeeId !== sender.employeeId) {
        await this.notifications.notifyEmployee(
          companyId,
          p.employeeId,
          'Yeni Mesaj',
          body.substring(0, 100),
          'MESSAGE',
          { conversationId },
        );
      }
      if (p.userId && p.userId !== sender.sub) {
        await this.notifications.notifyUser(
          companyId,
          p.userId,
          'Yeni Mesaj',
          body.substring(0, 100),
          'MESSAGE',
          { conversationId },
        );
      }
    }
  }

  async getConversations(companyId: string, user: JwtPayload) {
    const where = this.scope.conversationListWhere(user, companyId);
    return this.prisma.conversation.findMany({
      where,
      include: {
        participants: {
          include: {
            employee: {
              include: { user: { select: { firstName: true, lastName: true } } },
            },
            user: { select: { firstName: true, lastName: true } },
          },
        },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getConversation(conversationId: string) {
    return this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            employee: {
              include: { user: { select: { firstName: true, lastName: true } } },
            },
            user: { select: { firstName: true, lastName: true } },
          },
        },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
  }

  async getMessages(conversationId: string, user: JwtPayload, companyId: string) {
    await this.scope.assertConversationAccess(conversationId, user, companyId);
    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: {
        senderUser: { select: { firstName: true, lastName: true } },
        senderEmployee: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    });
  }

  async replyAsEmployee(
    conversationId: string,
    employeeId: string,
    body: string,
    user: JwtPayload,
    companyId: string,
  ) {
    await this.scope.assertConversationAccess(conversationId, user, companyId);
    const message = await this.prisma.message.create({
      data: { conversationId, senderEmployeeId: employeeId, body },
    });
    await this.notifyConversationParticipants(companyId, conversationId, user, body);
    return message;
  }
}
