import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateShiftSwapInput,
  CreateOvertimeInput,
  CreateAdvanceInput,
} from '@qr/shared';
import { StaffRequestStatus } from '@prisma/client';
import { BranchScope } from '../common/decorators';
import { employeeBranchWhere, canAccessBranch } from '../common/branch-scope';

type RequestKind = 'shift-swap' | 'overtime' | 'advance';

@Injectable()
export class RequestsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  // ---------- Create (employee) ----------

  async createShiftSwap(companyId: string, employeeId: string, dto: CreateShiftSwapInput) {
    const req = await this.prisma.shiftSwapRequest.create({
      data: {
        companyId,
        employeeId,
        targetEmployeeId: dto.targetEmployeeId,
        date: new Date(dto.date),
        toDate: dto.toDate ? new Date(dto.toDate) : null,
        reason: dto.reason,
      },
    });
    await this.notifyManagers(companyId, employeeId, 'Yeni Vardiya Takası Talebi');
    return req;
  }

  async createOvertime(companyId: string, employeeId: string, dto: CreateOvertimeInput) {
    const req = await this.prisma.overtimeRequest.create({
      data: {
        companyId,
        employeeId,
        date: new Date(dto.date),
        minutes: dto.minutes,
        reason: dto.reason,
      },
    });
    await this.notifyManagers(companyId, employeeId, 'Yeni Fazla Mesai Talebi');
    return req;
  }

  async createAdvance(companyId: string, employeeId: string, dto: CreateAdvanceInput) {
    const req = await this.prisma.advanceRequest.create({
      data: {
        companyId,
        employeeId,
        type: dto.type,
        amount: dto.amount,
        reason: dto.reason,
      },
    });
    await this.notifyManagers(companyId, employeeId, 'Yeni Avans/Masraf Talebi');
    return req;
  }

  private async notifyManagers(companyId: string, employeeId: string, title: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { manager: { select: { userId: true } }, user: { select: { firstName: true, lastName: true } } },
    });
    const body = `${employee?.user.firstName ?? ''} ${employee?.user.lastName ?? ''} talep gönderdi`;
    if (employee?.manager?.userId) {
      await this.notifications.notifyUser(companyId, employee.manager.userId, title, body, 'STAFF_REQUEST');
      return;
    }
    const admin = await this.prisma.user.findFirst({
      where: { companyId, role: { in: ['COMPANY_ADMIN', 'HR_MANAGER'] }, isActive: true },
    });
    if (admin) await this.notifications.notifyUser(companyId, admin.id, title, body, 'STAFF_REQUEST');
  }

  // ---------- My requests (employee) ----------

  async myRequests(employeeId: string) {
    const [shiftSwaps, overtime, advances] = await Promise.all([
      this.prisma.shiftSwapRequest.findMany({ where: { employeeId }, orderBy: { createdAt: 'desc' } }),
      this.prisma.overtimeRequest.findMany({ where: { employeeId }, orderBy: { createdAt: 'desc' } }),
      this.prisma.advanceRequest.findMany({ where: { employeeId }, orderBy: { createdAt: 'desc' } }),
    ]);
    return { shiftSwaps, overtime, advances };
  }

  // ---------- Manager list (scoped) ----------

  async listForManagers(companyId: string, scope?: BranchScope) {
    const branchFilter = employeeBranchWhere(scope);
    const include = {
      employee: { include: { user: { select: { firstName: true, lastName: true } } } },
    };
    const [shiftSwaps, overtime, advances] = await Promise.all([
      this.prisma.shiftSwapRequest.findMany({ where: { companyId, ...branchFilter }, include, orderBy: { createdAt: 'desc' } }),
      this.prisma.overtimeRequest.findMany({ where: { companyId, ...branchFilter }, include, orderBy: { createdAt: 'desc' } }),
      this.prisma.advanceRequest.findMany({ where: { companyId, ...branchFilter }, include, orderBy: { createdAt: 'desc' } }),
    ]);
    return { shiftSwaps, overtime, advances };
  }

  // ---------- Review ----------

  async review(
    companyId: string,
    kind: RequestKind,
    id: string,
    reviewerId: string,
    approve: boolean,
    note?: string,
    scope?: BranchScope,
  ) {
    const status = approve ? StaffRequestStatus.APPROVED : StaffRequestStatus.REJECTED;
    const data = { status, reviewedById: reviewerId, reviewedAt: new Date(), reviewNote: note };

    let employeeId: string;
    if (kind === 'shift-swap') {
      const r = await this.prisma.shiftSwapRequest.findFirst({ where: { id, companyId }, include: { employee: true } });
      if (!r) throw new NotFoundException('Talep bulunamadı');
      if (!canAccessBranch(scope, r.employee.branchId)) throw new ForbiddenException('Yetkiniz yok');
      await this.prisma.shiftSwapRequest.update({ where: { id }, data });
      employeeId = r.employeeId;
    } else if (kind === 'overtime') {
      const r = await this.prisma.overtimeRequest.findFirst({ where: { id, companyId }, include: { employee: true } });
      if (!r) throw new NotFoundException('Talep bulunamadı');
      if (!canAccessBranch(scope, r.employee.branchId)) throw new ForbiddenException('Yetkiniz yok');
      await this.prisma.overtimeRequest.update({ where: { id }, data });
      employeeId = r.employeeId;
    } else {
      const r = await this.prisma.advanceRequest.findFirst({ where: { id, companyId }, include: { employee: true } });
      if (!r) throw new NotFoundException('Talep bulunamadı');
      if (!canAccessBranch(scope, r.employee.branchId)) throw new ForbiddenException('Yetkiniz yok');
      await this.prisma.advanceRequest.update({ where: { id }, data });
      employeeId = r.employeeId;
    }

    await this.notifications.notifyEmployee(
      companyId,
      employeeId,
      approve ? 'Talep Onaylandı' : 'Talep Reddedildi',
      note || (approve ? 'Talebiniz onaylandı' : 'Talebiniz reddedildi'),
      'STAFF_REQUEST_REVIEW',
    );

    return { success: true };
  }
}
