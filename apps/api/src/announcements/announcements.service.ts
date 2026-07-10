import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnnouncementInput } from '@qr/shared';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AnnouncementsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async create(companyId: string, createdById: string, dto: CreateAnnouncementInput) {
    let employeeIds: string[] = [];

    if (dto.targetType === 'ALL') {
      const employees = await this.prisma.employee.findMany({
        where: { companyId, isActive: true },
        select: { id: true },
      });
      employeeIds = employees.map((e) => e.id);
    } else if (dto.targetType === 'DEPARTMENT' && dto.departmentIds?.length) {
      const employees = await this.prisma.employee.findMany({
        where: { companyId, departmentId: { in: dto.departmentIds }, isActive: true },
        select: { id: true },
      });
      employeeIds = employees.map((e) => e.id);
    } else if (dto.targetType === 'SELECTED' && dto.employeeIds?.length) {
      employeeIds = dto.employeeIds;
    }

    const announcement = await this.prisma.announcement.create({
      data: {
        companyId,
        title: dto.title,
        body: dto.body,
        requiresAck: dto.requiresAck,
        deadline: dto.deadline ? new Date(dto.deadline) : null,
        createdById,
        targets: { create: employeeIds.map((employeeId) => ({ employeeId })) },
        reads: {
          create: employeeIds.map((employeeId) => ({ employeeId })),
        },
      },
      include: { reads: true },
    });

    for (const empId of employeeIds) {
      await this.notifications.notifyEmployee(
        companyId,
        empId,
        dto.title,
        dto.body.substring(0, 100),
        'ANNOUNCEMENT',
        { announcementId: announcement.id, requiresAck: dto.requiresAck },
      );
    }

    return announcement;
  }

  async list(companyId: string) {
    return this.prisma.announcement.findMany({
      where: { companyId },
      include: {
        reads: {
          include: {
            employee: {
              include: { user: { select: { firstName: true, lastName: true } } },
            },
          },
        },
        _count: { select: { reads: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async myAnnouncements(employeeId: string) {
    return this.prisma.announcementRead.findMany({
      where: { employeeId },
      include: { announcement: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markRead(announcementId: string, employeeId: string, acknowledge = false) {
    return this.prisma.announcementRead.update({
      where: { announcementId_employeeId: { announcementId, employeeId } },
      data: {
        readAt: new Date(),
        ...(acknowledge ? { acknowledgedAt: new Date() } : {}),
      },
    });
  }

  async getReadStats(announcementId: string, companyId: string) {
    const announcement = await this.prisma.announcement.findFirst({
      where: { id: announcementId, companyId },
      include: {
        reads: {
          include: {
            employee: {
              include: { user: { select: { firstName: true, lastName: true } } },
            },
          },
        },
      },
    });
    if (!announcement) return null;

    const total = announcement.reads.length;
    const read = announcement.reads.filter((r) => r.readAt).length;
    const acked = announcement.reads.filter((r) => r.acknowledgedAt).length;

    return {
      announcement,
      stats: { total, read, pending: total - read, acknowledged: acked },
    };
  }
}
