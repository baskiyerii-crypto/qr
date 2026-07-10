import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffUserInput } from '@qr/shared';
import { UserRole } from '@prisma/client';
import { createUniquePublicId } from '../common/utils/public-id';
import { AuditService } from '../audit/audit.service';

const BRANCH_SCOPED_ROLES: UserRole[] = [UserRole.REGIONAL_MANAGER, UserRole.BRANCH_MANAGER];

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async listStaff(companyId: string) {
    return this.prisma.user.findMany({
      where: {
        companyId,
        role: {
          in: [
            UserRole.COMPANY_ADMIN,
            UserRole.HR_MANAGER,
            UserRole.REGIONAL_MANAGER,
            UserRole.BRANCH_MANAGER,
          ],
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        publicId: true,
        role: true,
        isActive: true,
        createdAt: true,
        branchAssignments: { select: { branchId: true, branch: { select: { name: true } } } },
      },
      orderBy: { firstName: 'asc' },
    });
  }

  private async validateBranchIds(companyId: string, branchIds: string[]) {
    if (branchIds.length === 0) return;
    const count = await this.prisma.branch.count({
      where: { id: { in: branchIds }, companyId },
    });
    if (count !== new Set(branchIds).size) {
      throw new BadRequestException('Geçersiz şube seçimi');
    }
  }

  async createStaff(companyId: string, dto: CreateStaffUserInput, actorId?: string) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Bu e-posta zaten kayıtlı');

    const branchIds = dto.branchIds ?? [];
    if (BRANCH_SCOPED_ROLES.includes(dto.role)) {
      if (branchIds.length === 0) {
        throw new BadRequestException('Bu rol için en az bir şube seçilmelidir');
      }
      if (dto.role === UserRole.BRANCH_MANAGER && branchIds.length > 1) {
        throw new BadRequestException('Şube müdürü yalnızca bir şubeye atanabilir');
      }
      await this.validateBranchIds(companyId, branchIds);
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const publicId = await createUniquePublicId(this.prisma);
    const created = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: dto.role,
        companyId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        publicId,
        isActive: true,
        ...(BRANCH_SCOPED_ROLES.includes(dto.role)
          ? { branchAssignments: { create: branchIds.map((branchId) => ({ branchId })) } }
          : {}),
      },
      select: {
        id: true,
        publicId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        branchAssignments: { select: { branchId: true } },
      },
    });

    if (actorId) {
      await this.audit
        .log({
          companyId,
          actorId,
          action: 'STAFF_CREATED',
          entityType: 'User',
          entityId: created.id,
          metadata: { role: dto.role, email: dto.email, branchIds },
        })
        .catch(() => undefined);
    }
    return created;
  }

  async assignBranches(companyId: string, userId: string, branchIds: string[], actorId?: string) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, companyId } });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı');
    if (!BRANCH_SCOPED_ROLES.includes(user.role)) {
      throw new BadRequestException('Bu kullanıcı için şube ataması yapılamaz');
    }
    if (user.role === UserRole.BRANCH_MANAGER && branchIds.length > 1) {
      throw new BadRequestException('Şube müdürü yalnızca bir şubeye atanabilir');
    }
    await this.validateBranchIds(companyId, branchIds);
    await this.prisma.$transaction([
      this.prisma.branchAssignment.deleteMany({ where: { userId } }),
      this.prisma.branchAssignment.createMany({
        data: branchIds.map((branchId) => ({ userId, branchId })),
      }),
    ]);
    if (actorId) {
      await this.audit
        .log({
          companyId,
          actorId,
          action: 'STAFF_BRANCHES_ASSIGNED',
          entityType: 'User',
          entityId: userId,
          metadata: { branchIds },
        })
        .catch(() => undefined);
    }
    return { success: true };
  }

  async resetPassword(companyId: string, userId: string, password: string, actorId?: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, companyId },
    });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı');

    const passwordHash = await bcrypt.hash(password, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
    if (actorId) {
      await this.audit
        .log({
          companyId,
          actorId,
          action: 'STAFF_PASSWORD_RESET',
          entityType: 'User',
          entityId: userId,
        })
        .catch(() => undefined);
    }
    return { success: true };
  }

  async setActive(companyId: string, userId: string, isActive: boolean, actorId?: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, companyId },
    });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı');

    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });
    if (actorId) {
      await this.audit
        .log({
          companyId,
          actorId,
          action: isActive ? 'STAFF_ACTIVATED' : 'STAFF_DEACTIVATED',
          entityType: 'User',
          entityId: userId,
        })
        .catch(() => undefined);
    }
    return { success: true };
  }
}
