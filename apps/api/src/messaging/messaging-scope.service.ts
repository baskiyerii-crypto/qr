import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConversationType, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BranchScope, JwtPayload } from '../common/decorators';
import { branchWhere } from '../common/branch-scope';

const MANAGER_ROLES: UserRole[] = [
  UserRole.COMPANY_ADMIN,
  UserRole.HR_MANAGER,
  UserRole.REGIONAL_MANAGER,
  UserRole.BRANCH_MANAGER,
];

@Injectable()
export class MessagingScopeService {
  constructor(private prisma: PrismaService) {}

  isManager(role: UserRole): boolean {
    return MANAGER_ROLES.includes(role);
  }

  canStartConversation(user: JwtPayload): boolean {
    return this.isManager(user.role);
  }

  canCreateGroup(user: JwtPayload): boolean {
    return this.isManager(user.role);
  }

  async assertCanMessageEmployee(
    companyId: string,
    user: JwtPayload,
    employeeId: string,
  ): Promise<void> {
    if (!this.isManager(user.role)) {
      throw new ForbiddenException('Personel yeni konuşma başlatamaz');
    }

    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, companyId, isActive: true },
    });
    if (!employee) throw new ForbiddenException('Personel bulunamadı');

    if (user.branchScope?.mode === 'LIST') {
      const ids = user.branchScope.branchIds ?? [];
      if (!employee.branchId || !ids.includes(employee.branchId)) {
        throw new ForbiddenException('Bu personele mesaj gönderme yetkiniz yok');
      }
    }
  }

  async filterEmployeeIdsInScope(
    companyId: string,
    scope: BranchScope,
    employeeIds: string[],
  ): Promise<string[]> {
    const employees = await this.prisma.employee.findMany({
      where: { companyId, isActive: true, id: { in: employeeIds }, ...branchWhere(scope) },
      select: { id: true },
    });
    return employees.map((e) => e.id);
  }

  async assertCanAddGroupMembers(
    companyId: string,
    user: JwtPayload,
    memberEmployeeIds: string[],
    memberUserIds: string[] = [],
  ): Promise<void> {
    if (!this.canCreateGroup(user)) {
      throw new ForbiddenException('Grup oluşturma yetkiniz yok');
    }

    const scoped = await this.filterEmployeeIdsInScope(companyId, user.branchScope, memberEmployeeIds);
    if (scoped.length !== memberEmployeeIds.length) {
      throw new ForbiddenException('Bazı personeller kapsam dışında');
    }

    if (memberUserIds.length) {
      const users = await this.prisma.user.findMany({
        where: {
          id: { in: memberUserIds },
          companyId,
          isActive: true,
          role: { in: MANAGER_ROLES },
        },
      });
      if (users.length !== memberUserIds.length) {
        throw new ForbiddenException('Geçersiz grup üyesi');
      }
    }
  }

  async assertConversationAccess(
    conversationId: string,
    user: JwtPayload,
    companyId: string,
  ): Promise<void> {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, companyId },
      include: { participants: true },
    });
    if (!conversation) throw new ForbiddenException('Konuşma bulunamadı');

    const isParticipant = conversation.participants.some(
      (p) =>
        (user.employeeId && p.employeeId === user.employeeId) ||
        p.userId === user.sub,
    );

    if (isParticipant) return;

    if (this.isManager(user.role)) {
      if (user.branchScope?.mode === 'ALL') return;

      const employeeParticipants = conversation.participants
        .filter((p) => p.employeeId)
        .map((p) => p.employeeId!);

      if (!employeeParticipants.length) return;

      const employees = await this.prisma.employee.findMany({
        where: { id: { in: employeeParticipants } },
        select: { branchId: true },
      });
      const ids = user.branchScope?.branchIds ?? [];
      const inScope = employees.every((e) => e.branchId && ids.includes(e.branchId));
      if (inScope) return;
    }

    throw new ForbiddenException('Bu konuşmaya erişim yok');
  }

  conversationListWhere(user: JwtPayload, companyId: string) {
    if (user.employeeId && user.role === UserRole.EMPLOYEE) {
      return {
        companyId,
        participants: { some: { employeeId: user.employeeId } },
      };
    }

    if (user.role === UserRole.EMPLOYEE && !user.employeeId) {
      return { companyId, id: '__none__' };
    }

    if (this.isManager(user.role)) {
      if (user.branchScope?.mode === 'ALL') {
        return {
          companyId,
          OR: [
            { participants: { some: { userId: user.sub } } },
            { type: { in: [ConversationType.DIRECT, ConversationType.BROADCAST, ConversationType.GROUP] } },
          ],
        };
      }

      return {
        companyId,
        OR: [
          { participants: { some: { userId: user.sub } } },
          {
            participants: {
              some: {
                employee: {
                  branchId: { in: user.branchScope?.branchIds ?? ['__none__'] },
                },
              },
            },
          },
        ],
      };
    }

    return { companyId };
  }
}
