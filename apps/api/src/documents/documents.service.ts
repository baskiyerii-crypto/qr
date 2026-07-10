import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDocumentInput } from '@qr/shared';
import { BranchScope } from '../common/decorators';
import { canAccessBranch } from '../common/branch-scope';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: string, dto: CreateEmployeeDocumentInput, scope?: BranchScope) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: dto.employeeId, companyId },
    });
    if (!employee) throw new NotFoundException('Personel bulunamadı');
    if (!canAccessBranch(scope, employee.branchId)) throw new ForbiddenException('Yetkiniz yok');

    return this.prisma.employeeDocument.create({
      data: {
        companyId,
        employeeId: dto.employeeId,
        type: dto.type,
        title: dto.title,
        fileUrl: dto.fileUrl,
        metadata: dto.metadata ? JSON.stringify(dto.metadata) : null,
      },
    });
  }

  async list(companyId: string, employeeId?: string, scope?: BranchScope) {
    const branchFilter =
      scope && scope.mode === 'LIST'
        ? { employee: { branchId: { in: scope.branchIds.length ? scope.branchIds : ['__none__'] } } }
        : {};
    return this.prisma.employeeDocument.findMany({
      where: {
        companyId,
        ...(employeeId ? { employeeId } : {}),
        ...branchFilter,
      },
      include: {
        employee: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listMine(employeeId: string) {
    return this.prisma.employeeDocument.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(companyId: string, id: string, scope?: BranchScope) {
    const doc = await this.prisma.employeeDocument.findFirst({
      where: { id, companyId },
      include: { employee: true },
    });
    if (!doc) throw new NotFoundException('Belge bulunamadı');
    if (!canAccessBranch(scope, doc.employee.branchId)) throw new ForbiddenException('Yetkiniz yok');
    await this.prisma.employeeDocument.delete({ where: { id } });
    return { success: true };
  }
}
