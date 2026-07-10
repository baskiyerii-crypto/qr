import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BranchScope } from '../common/decorators';

@Injectable()
export class ShiftsService {
  constructor(private prisma: PrismaService) {}

  async createTemplate(
    companyId: string,
    data: { name: string; dayOfWeek: number; startTime: string; endTime: string },
  ) {
    return this.prisma.shiftTemplate.create({ data: { companyId, ...data } });
  }

  async listTemplates(companyId: string) {
    return this.prisma.shiftTemplate.findMany({
      where: { companyId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async assignToEmployee(companyId: string, employeeId: string, shiftTemplateIds: string[]) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, companyId },
    });
    if (!employee) throw new NotFoundException('Personel bulunamadı');

    const templates = await this.prisma.shiftTemplate.findMany({
      where: { id: { in: shiftTemplateIds }, companyId },
    });
    if (templates.length !== shiftTemplateIds.length) {
      throw new ForbiddenException('Geçersiz vardiya şablonu');
    }

    const now = new Date();
    await this.prisma.employeeShift.updateMany({
      where: { employeeId, effectiveTo: null },
      data: { effectiveTo: now },
    });

    await this.prisma.employeeShift.createMany({
      data: shiftTemplateIds.map((shiftTemplateId) => ({
        employeeId,
        shiftTemplateId,
        effectiveFrom: now,
      })),
    });

    return this.getEmployeeShifts(companyId, employeeId);
  }

  async getEmployeeShifts(companyId: string, employeeId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, companyId },
    });
    if (!employee) throw new NotFoundException('Personel bulunamadı');

    return this.prisma.employeeShift.findMany({
      where: { employeeId, effectiveTo: null },
      include: { shiftTemplate: true },
    });
  }

  async listCompanyAssignments(companyId: string, scope?: BranchScope) {
    const branchFilter =
      scope && scope.mode === 'LIST'
        ? { branchId: { in: scope.branchIds.length ? scope.branchIds : ['__none__'] } }
        : {};
    return this.prisma.employeeShift.findMany({
      where: { employee: { companyId, ...branchFilter }, effectiveTo: null },
      include: {
        employee: { include: { user: { select: { firstName: true, lastName: true } } } },
        shiftTemplate: true,
      },
    });
  }

  async createHoliday(companyId: string, name: string, date: string) {
    return this.prisma.holiday.create({
      data: { companyId, name, date: new Date(date) },
    });
  }

  async listHolidays(companyId: string, year: number) {
    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 1);
    return this.prisma.holiday.findMany({
      where: { companyId, date: { gte: start, lt: end } },
      orderBy: { date: 'asc' },
    });
  }
}
