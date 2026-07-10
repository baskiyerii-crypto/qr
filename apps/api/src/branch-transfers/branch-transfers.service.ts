import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBranchTransferInput } from '@qr/shared';
import { BranchTransferStatus, BranchTransferType } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';
import { BranchScope } from '../common/decorators';
import { branchWhere, canAccessBranch } from '../common/branch-scope';

@Injectable()
export class BranchTransfersService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private audit: AuditService,
  ) {}

  async list(companyId: string, scope?: BranchScope) {
    // Managers see transfers targeting branches they manage
    return this.prisma.branchTransfer.findMany({
      where: { companyId, ...branchWhere(scope, 'toBranchId') },
      include: {
        employee: { include: { user: { select: { firstName: true, lastName: true } } } },
        fromBranch: { select: { name: true } },
        toBranch: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(companyId: string, actorId: string, dto: CreateBranchTransferInput, scope?: BranchScope) {
    if (!canAccessBranch(scope, dto.toBranchId)) {
      throw new ForbiddenException('Bu şubeye geçiş atama yetkiniz yok');
    }
    const employee = await this.prisma.employee.findFirst({
      where: { id: dto.employeeId, companyId },
    });
    if (!employee) throw new NotFoundException('Personel bulunamadı');

    const toBranch = await this.prisma.branch.findFirst({
      where: { id: dto.toBranchId, companyId, isActive: true },
    });
    if (!toBranch) throw new NotFoundException('Hedef şube bulunamadı');

    if (dto.type === BranchTransferType.TEMPORARY && !dto.effectiveTo) {
      throw new BadRequestException('Geçici geçiş için bitiş tarihi gereklidir');
    }

    const effectiveFrom = dto.effectiveFrom ? new Date(dto.effectiveFrom) : new Date();
    const fromBranchId = employee.branchId;

    const transfer = await this.prisma.branchTransfer.create({
      data: {
        companyId,
        employeeId: dto.employeeId,
        fromBranchId,
        toBranchId: dto.toBranchId,
        type: dto.type,
        status: BranchTransferStatus.ACTIVE,
        effectiveFrom,
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
        reason: dto.reason,
        reviewedById: actorId,
        reviewedAt: new Date(),
      },
    });

    // Kalıcı geçişte personelin görev yeri hemen güncellenir
    if (dto.type === BranchTransferType.PERMANENT) {
      await this.prisma.employee.update({
        where: { id: dto.employeeId },
        data: { branchId: dto.toBranchId },
      });
    }

    await this.notifications.notifyEmployee(
      companyId,
      dto.employeeId,
      'Şube Geçişi',
      `${toBranch.name} şubesine ${dto.type === BranchTransferType.PERMANENT ? 'kalıcı' : 'geçici'} olarak atandınız`,
      'BRANCH_TRANSFER',
      { transferId: transfer.id },
    );

    await this.audit.log({
      companyId,
      actorId,
      action: 'BRANCH_TRANSFER_CREATE',
      entityType: 'BranchTransfer',
      entityId: transfer.id,
      metadata: { employeeId: dto.employeeId, toBranchId: dto.toBranchId, type: dto.type },
    });

    return transfer;
  }

  async end(companyId: string, id: string, actorId: string, scope?: BranchScope) {
    const transfer = await this.prisma.branchTransfer.findFirst({
      where: { id, companyId },
    });
    if (!transfer) throw new NotFoundException('Geçiş bulunamadı');
    if (!canAccessBranch(scope, transfer.toBranchId)) {
      throw new ForbiddenException('Yetkiniz yok');
    }
    const updated = await this.prisma.branchTransfer.update({
      where: { id },
      data: { status: BranchTransferStatus.ENDED, effectiveTo: new Date() },
    });
    await this.audit.log({
      companyId,
      actorId,
      action: 'BRANCH_TRANSFER_END',
      entityType: 'BranchTransfer',
      entityId: id,
    });
    return updated;
  }
}
