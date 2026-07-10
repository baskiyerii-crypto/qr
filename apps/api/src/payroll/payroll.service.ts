import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TimesheetsService } from '../timesheets/timesheets.service';
import { PayrollStatus } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

@Injectable()
export class PayrollService {
  constructor(
    private prisma: PrismaService,
    private timesheets: TimesheetsService,
  ) {}

  async calculate(companyId: string, year: number, month: number) {
    const company = await this.prisma.company.findUniqueOrThrow({
      where: { id: companyId },
    });

    const employees = await this.prisma.employee.findMany({
      where: { companyId, isActive: true, monthlySalary: { not: null } },
    });

    const payrollRun = await this.prisma.payrollRun.upsert({
      where: { companyId_year_month: { companyId, year, month } },
      create: { companyId, year, month, status: PayrollStatus.CALCULATED, calculatedAt: new Date() },
      update: { status: PayrollStatus.CALCULATED, calculatedAt: new Date() },
    });

    await this.prisma.payrollLineItem.deleteMany({ where: { payrollRunId: payrollRun.id } });

    const lineItems = [];
    for (const emp of employees) {
      await this.timesheets.calculateForEmployee(emp.id, year, month);
      const summary = await this.timesheets.getSummary(emp.id, year, month);

      const baseSalary = Number(emp.monthlySalary);
      const hourlyRate = baseSalary / 176;
      const overtimeHours = summary.totalOvertimeMinutes / 60;
      const missingHours = summary.totalMissingMinutes / 60;
      const overtimePay = overtimeHours * hourlyRate * company.overtimeMultiplier;
      const deductions = missingHours * hourlyRate;
      const netPay = baseSalary + overtimePay - deductions;

      const item = await this.prisma.payrollLineItem.create({
        data: {
          payrollRunId: payrollRun.id,
          employeeId: emp.id,
          baseSalary,
          workedDays: summary.entries.filter((e) => e.workedMinutes > 0).length,
          absentDays: summary.absentDays,
          overtimeHours,
          missingHours,
          overtimePay,
          deductions,
          netPay,
        },
        include: {
          employee: {
            include: { user: { select: { firstName: true, lastName: true } } },
          },
        },
      });
      lineItems.push(item);
    }

    return { payrollRun, lineItems };
  }

  async getEmployeeSummary(employeeId: string, year: number, month: number) {
    const employee = await this.prisma.employee.findUniqueOrThrow({
      where: { id: employeeId },
      include: {
        user: { select: { firstName: true, lastName: true } },
        company: { select: { overtimeMultiplier: true } },
      },
    });

    const summary = await this.timesheets.getSummary(employeeId, year, month);
    const baseSalary = Number(employee.monthlySalary || 0);
    const hourlyRate = baseSalary / 176;
    const otMultiplier = Number(employee.company.overtimeMultiplier || 1.5);
    const overtimePay = (summary.totalOvertimeMinutes / 60) * hourlyRate * otMultiplier;
    const deductions = (summary.totalMissingMinutes / 60) * hourlyRate;

    return {
      employee,
      period: { year, month },
      summary,
      payroll: {
        baseSalary,
        overtimePay,
        deductions,
        estimatedNet: baseSalary + overtimePay - deductions,
      },
    };
  }

  async exportExcel(companyId: string, year: number, month: number) {
    const run = await this.prisma.payrollRun.findUnique({
      where: { companyId_year_month: { companyId, year, month } },
      include: {
        lineItems: {
          include: {
            employee: {
              include: { user: { select: { firstName: true, lastName: true } } },
            },
          },
        },
      },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Bordro');
    sheet.columns = [
      { header: 'Personel', key: 'name', width: 25 },
      { header: 'Maaş', key: 'base', width: 12 },
      { header: 'Fazla Mesai', key: 'ot', width: 12 },
      { header: 'Kesinti', key: 'ded', width: 12 },
      { header: 'Net', key: 'net', width: 12 },
    ];

    for (const item of run?.lineItems || []) {
      sheet.addRow({
        name: `${item.employee.user.firstName} ${item.employee.user.lastName}`,
        base: Number(item.baseSalary),
        ot: Number(item.overtimePay),
        ded: Number(item.deductions),
        net: Number(item.netPay),
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  async exportPdf(companyId: string, year: number, month: number): Promise<Buffer> {
    const run = await this.prisma.payrollRun.findUnique({
      where: { companyId_year_month: { companyId, year, month } },
      include: {
        lineItems: {
          include: {
            employee: {
              include: { user: { select: { firstName: true, lastName: true } } },
            },
          },
        },
      },
    });

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(18).text(`Bordro - ${month}/${year}`, { align: 'center' });
      doc.moveDown();
      for (const item of run?.lineItems || []) {
        doc.fontSize(12).text(
          `${item.employee.user.firstName} ${item.employee.user.lastName}: ${Number(item.netPay).toFixed(2)} TL`,
        );
      }
      doc.end();
    });
  }
}
