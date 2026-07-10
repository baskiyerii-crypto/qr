import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as ExcelJS from 'exceljs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeInput } from '@qr/shared';
import { UserRole } from '@prisma/client';
import { createUniquePublicId } from '../common/utils/public-id';
import { BranchScope } from '../common/decorators';
import { resolveBranchFilter, branchWhere } from '../common/branch-scope';

const IMPORT_HEADERS = [
  'Ad',
  'Soyad',
  'E-posta',
  'Şifre',
  'Pozisyon',
  'Şube',
  'Departman',
  'Aylık Maaş',
] as const;

const HEADER_ALIASES: Record<string, keyof ImportRow> = {
  ad: 'firstName',
  firstname: 'firstName',
  'first name': 'firstName',
  soyad: 'lastName',
  lastname: 'lastName',
  'last name': 'lastName',
  eposta: 'email',
  'e-posta': 'email',
  email: 'email',
  mail: 'email',
  sifre: 'password',
  şifre: 'password',
  password: 'password',
  pozisyon: 'position',
  position: 'position',
  sube: 'branchName',
  şube: 'branchName',
  branch: 'branchName',
  departman: 'departmentName',
  department: 'departmentName',
  aylikmaas: 'monthlySalary',
  'aylık maaş': 'monthlySalary',
  maas: 'monthlySalary',
  maaş: 'monthlySalary',
  salary: 'monthlySalary',
};

interface ImportRow {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  position?: string;
  branchName?: string;
  departmentName?: string;
  monthlySalary?: number;
}

interface ImportFailure {
  row: number;
  email?: string;
  error: string;
}

export interface BulkImportResult {
  total: number;
  created: number;
  failed: number;
  createdRows: Array<{ row: number; email: string; name: string }>;
  failedRows: ImportFailure[];
  message: string;
}

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async list(companyId: string, branchId?: string, includeInactive = false, scope?: BranchScope) {
    const { where: branchFilter } = resolveBranchFilter(scope, branchId);
    return this.prisma.employee.findMany({
      where: {
        companyId,
        ...(includeInactive ? {} : { isActive: true }),
        ...branchFilter,
      },
      include: {
        user: { select: { email: true, firstName: true, lastName: true, publicId: true, isActive: true } },
        manager: { include: { user: { select: { firstName: true, lastName: true, publicId: true } } } },
        branch: { select: { name: true } },
        department: { select: { name: true } },
        shifts: {
          where: { effectiveTo: null },
          include: { shiftTemplate: true },
        },
      },
      orderBy: { user: { firstName: 'asc' } },
    });
  }

  async create(companyId: string, dto: CreateEmployeeInput) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Bu e-posta zaten kayıtlı');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const publicId = await createUniquePublicId(this.prisma);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: UserRole.EMPLOYEE,
        companyId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        publicId,
        isActive: true,
      },
    });

    const employee = await this.prisma.employee.create({
      data: {
        companyId,
        userId: user.id,
        monthlySalary: dto.monthlySalary,
        position: dto.position,
        branchId: dto.branchId,
        departmentId: dto.departmentId,
        managerId: dto.managerId,
        hireDate: dto.hireDate ? new Date(dto.hireDate) : new Date(),
      },
      include: { user: true, branch: true, department: true },
    });

    return { employee, message: 'Personel oluşturuldu. Mobil uygulamadan giriş yapabilir.' };
  }

  async generateImportTemplate(): Promise<ExcelJS.Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Personel');
    sheet.addRow([...IMPORT_HEADERS]);
    sheet.addRow([
      'Ahmet',
      'Yılmaz',
      'ahmet@firma.com',
      'Sifre123!',
      'Satış Temsilcisi',
      'Merkez',
      'Satış',
      25000,
    ]);
    sheet.getRow(1).font = { bold: true };
    sheet.columns = IMPORT_HEADERS.map(() => ({ width: 18 }));
    return workbook.xlsx.writeBuffer();
  }

  async importFromExcel(companyId: string, buffer: Buffer): Promise<BulkImportResult> {
    const rows = await this.parseImportRows(buffer);
    if (rows.length === 0) {
      throw new BadRequestException('Excel dosyasında veri satırı bulunamadı');
    }

    const [branches, departments] = await Promise.all([
      this.prisma.branch.findMany({ where: { companyId, isActive: true } }),
      this.prisma.department.findMany({ where: { companyId } }),
    ]);

    const created: Array<{ row: number; email: string; name: string }> = [];
    const failed: ImportFailure[] = [];

    for (const { rowNumber, data } of rows) {
      try {
        const email = data.email?.trim().toLowerCase();
        if (!data.firstName?.trim()) throw new Error('Ad zorunludur');
        if (!data.lastName?.trim()) throw new Error('Soyad zorunludur');
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Geçerli e-posta gerekli');
        if (!data.password || data.password.length < 8) throw new Error('Şifre en az 8 karakter olmalı');

        const existing = await this.prisma.user.findUnique({ where: { email } });
        if (existing) throw new Error('Bu e-posta zaten kayıtlı');

        let branchId: string | undefined;
        if (data.branchName?.trim()) {
          const branch = branches.find(
            (b) => b.name.toLowerCase() === data.branchName!.trim().toLowerCase(),
          );
          if (!branch) throw new Error(`Şube bulunamadı: ${data.branchName}`);
          branchId = branch.id;
        }

        let departmentId: string | undefined;
        if (data.departmentName?.trim()) {
          const dept = departments.find(
            (d) => d.name.toLowerCase() === data.departmentName!.trim().toLowerCase(),
          );
          if (!dept) throw new Error(`Departman bulunamadı: ${data.departmentName}`);
          departmentId = dept.id;
        }

        const passwordHash = await bcrypt.hash(data.password, 12);
        const publicId = await createUniquePublicId(this.prisma);
        const user = await this.prisma.user.create({
          data: {
            email,
            passwordHash,
            role: UserRole.EMPLOYEE,
            companyId,
            firstName: data.firstName.trim(),
            lastName: data.lastName.trim(),
            publicId,
            isActive: true,
          },
        });

        await this.prisma.employee.create({
          data: {
            companyId,
            userId: user.id,
            monthlySalary: data.monthlySalary,
            position: data.position?.trim() || undefined,
            branchId,
            departmentId,
            hireDate: new Date(),
          },
        });

        created.push({
          row: rowNumber,
          email,
          name: `${data.firstName.trim()} ${data.lastName.trim()}`,
        });
      } catch (err) {
        failed.push({
          row: rowNumber,
          email: data.email,
          error: err instanceof Error ? err.message : 'Bilinmeyen hata',
        });
      }
    }

    return {
      total: rows.length,
      created: created.length,
      failed: failed.length,
      createdRows: created,
      failedRows: failed,
      message: `${created.length} personel eklendi${failed.length ? `, ${failed.length} satır hatalı` : ''}.`,
    };
  }

  private async parseImportRows(buffer: Buffer) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
    const sheet = workbook.worksheets[0];
    if (!sheet) return [];

    const headerRow = sheet.getRow(1);
    const columnMap = new Map<number, keyof ImportRow>();
    headerRow.eachCell((cell, col) => {
      const raw = String(cell.value ?? '').trim().toLowerCase();
      const key = HEADER_ALIASES[raw];
      if (key) columnMap.set(col, key);
    });

    const required = ['firstName', 'lastName', 'email', 'password'] as const;
    const mapped = new Set(columnMap.values());
    if (!required.every((f) => mapped.has(f))) {
      throw new BadRequestException(
        'Excel başlıkları hatalı. Şablonu indirip kullanın: Ad, Soyad, E-posta, Şifre zorunludur.',
      );
    }

    const rows: Array<{ rowNumber: number; data: Partial<ImportRow> }> = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const data: Partial<ImportRow> = {};
      columnMap.forEach((field, col) => {
        const value = row.getCell(col).value;
        if (value === null || value === undefined || value === '') return;
        if (field === 'monthlySalary') {
          const num = typeof value === 'number' ? value : parseFloat(String(value).replace(',', '.'));
          if (!isNaN(num)) data.monthlySalary = num;
        } else {
          data[field] = String(value).trim() as never;
        }
      });
      if (!data.email && !data.firstName && !data.lastName) return;
      rows.push({ rowNumber, data });
    });

    return rows;
  }

  async getById(companyId: string, id: string, scope?: BranchScope) {
    const employee = await this.prisma.employee.findFirst({
      where: { id, companyId },
      include: {
        user: true,
        branch: true,
        department: true,
        devices: true,
        shifts: { where: { effectiveTo: null }, include: { shiftTemplate: true } },
      },
    });
    if (!employee) throw new NotFoundException('Personel bulunamadı');
    if (scope && scope.mode === 'LIST') {
      if (!employee.branchId || !scope.branchIds.includes(employee.branchId)) {
        throw new NotFoundException('Personel bulunamadı');
      }
    }
    return employee;
  }

  async updateSalary(companyId: string, id: string, monthlySalary: number) {
    return this.prisma.employee.updateMany({
      where: { id, companyId },
      data: { monthlySalary },
    });
  }

  async deactivate(companyId: string, id: string) {
    const employee = await this.prisma.employee.findFirst({ where: { id, companyId } });
    if (!employee) throw new NotFoundException('Personel bulunamadı');
    await this.prisma.$transaction([
      this.prisma.employee.update({ where: { id }, data: { isActive: false } }),
      this.prisma.user.update({ where: { id: employee.userId }, data: { isActive: false } }),
    ]);
    return { success: true };
  }

  async getLiveAttendance(companyId: string, scope?: BranchScope) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const records = await this.prisma.attendanceRecord.findMany({
      where: { companyId, serverTimestamp: { gte: today }, ...branchWhere(scope) },
      include: {
        employee: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        branch: { select: { name: true } },
      },
      orderBy: { serverTimestamp: 'desc' },
    });

    const checkedIn = new Map<string, (typeof records)[0]>();
    for (const r of records) {
      if (r.type === 'CHECK_IN') checkedIn.set(r.employeeId, r);
      if (r.type === 'CHECK_OUT') checkedIn.delete(r.employeeId);
    }

    return Array.from(checkedIn.values());
  }
}
