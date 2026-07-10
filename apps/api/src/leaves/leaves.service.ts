import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeaveInput } from '@qr/shared';
import { LeaveStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { BranchScope } from '../common/decorators';
import { employeeBranchWhere, canAccessBranch } from '../common/branch-scope';

@Injectable()
export class LeavesService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async create(employeeId: string, companyId: string, dto: CreateLeaveInput) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { user: true, manager: { include: { user: true } } },
    });

    const leave = await this.prisma.leaveRequest.create({
      data: {
        companyId,
        employeeId,
        type: dto.type,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        reason: dto.reason,
      },
    });

    const managerUserId = employee?.manager?.userId;
    if (managerUserId) {
      await this.notifications.notifyUser(
        companyId,
        managerUserId,
        'Yeni İzin Talebi',
        `${employee?.user.firstName} ${employee?.user.lastName} izin talebi gönderdi`,
        'LEAVE_REQUEST',
        { leaveId: leave.id },
      );
    } else {
      const admin = await this.prisma.user.findFirst({
        where: { companyId, role: { in: ['COMPANY_ADMIN', 'HR_MANAGER', 'BRANCH_MANAGER'] }, isActive: true },
      });
      if (admin) {
        await this.notifications.notifyUser(companyId, admin.id, 'Yeni İzin Talebi', 'Personel izin talebi gönderdi', 'LEAVE_REQUEST', { leaveId: leave.id });
      }
    }

    return leave;
  }

  async list(companyId: string, status?: LeaveStatus, scope?: BranchScope) {
    return this.prisma.leaveRequest.findMany({
      where: { companyId, ...(status ? { status } : {}), ...employeeBranchWhere(scope) },
      include: {
        employee: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async myLeaves(employeeId: string) {
    return this.prisma.leaveRequest.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async review(
    companyId: string,
    leaveId: string,
    reviewerId: string,
    approve: boolean,
    note?: string,
    scope?: BranchScope,
  ) {
    const leave = await this.prisma.leaveRequest.findFirst({
      where: { id: leaveId, companyId },
      include: { employee: true },
    });
    if (!leave) throw new NotFoundException('İzin talebi bulunamadı');
    if (!canAccessBranch(scope, leave.employee.branchId)) {
      throw new ForbiddenException('Bu talebi inceleme yetkiniz yok');
    }

    const updated = await this.prisma.leaveRequest.update({
      where: { id: leaveId },
      data: {
        status: approve ? LeaveStatus.APPROVED : LeaveStatus.REJECTED,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        reviewNote: note,
      },
    });

    await this.notifications.notifyEmployee(
      companyId,
      leave.employeeId,
      approve ? 'İzin Onaylandı' : 'İzin Reddedildi',
      note || (approve ? 'İzin talebiniz onaylandı' : 'İzin talebiniz reddedildi'),
      'LEAVE_REVIEW',
    );

    return updated;
  }
}
