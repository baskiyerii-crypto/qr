import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BranchScope } from '../common/decorators';
import * as ExcelJS from 'exceljs';

export interface BranchStat {
  branchId: string;
  branchName: string;
  employeeCount: number;
  presentToday: number;
  totalWorkedHours: number;
  totalOvertimeHours: number;
  totalLateMinutes: number;
  absentDays: number;
  lateEntries: number;
}

@Injectable()
export class ReportsService implements OnModuleInit {
  private readonly logger = new Logger(ReportsService.name);
  private lastAlertDate: string | null = null;

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  onModuleInit() {
    setInterval(() => this.tickAbsenceScheduler(), 60 * 60 * 1000);
  }

  private scopedBranchIds(scope?: BranchScope): string[] | null {
    if (!scope || scope.mode === 'ALL') return null;
    return scope.branchIds;
  }

  async getBranchComparison(
    companyId: string,
    year: number,
    month: number,
    scope?: BranchScope,
  ): Promise<BranchStat[]> {
    const allowed = this.scopedBranchIds(scope);
    const branches = await this.prisma.branch.findMany({
      where: {
        companyId,
        isActive: true,
        ...(allowed ? { id: { in: allowed.length ? allowed : ['__none__'] } } : {}),
      },
      orderBy: { name: 'asc' },
    });

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const stats: BranchStat[] = [];
    for (const branch of branches) {
      const employees = await this.prisma.employee.findMany({
        where: { companyId, branchId: branch.id, isActive: true },
        select: { id: true },
      });
      const employeeIds = employees.map((e) => e.id);

      let totalWorked = 0;
      let totalOvertime = 0;
      let totalLate = 0;
      let absentDays = 0;
      let lateEntries = 0;
      let presentToday = 0;

      if (employeeIds.length) {
        const entries = await this.prisma.timesheetEntry.findMany({
          where: { employeeId: { in: employeeIds }, date: { gte: start, lt: end } },
          select: {
            workedMinutes: true,
            overtimeMinutes: true,
            lateMinutes: true,
            isAbsent: true,
          },
        });
        for (const e of entries) {
          totalWorked += e.workedMinutes;
          totalOvertime += e.overtimeMinutes;
          totalLate += e.lateMinutes;
          if (e.isAbsent) absentDays += 1;
          if (e.lateMinutes > 0) lateEntries += 1;
        }

        presentToday = await this.prisma.attendanceRecord.count({
          where: {
            branchId: branch.id,
            type: 'CHECK_IN',
            serverTimestamp: { gte: todayStart, lt: todayEnd },
          },
        });
      }

      stats.push({
        branchId: branch.id,
        branchName: branch.name,
        employeeCount: employeeIds.length,
        presentToday,
        totalWorkedHours: Math.round((totalWorked / 60) * 10) / 10,
        totalOvertimeHours: Math.round((totalOvertime / 60) * 10) / 10,
        totalLateMinutes: totalLate,
        absentDays,
        lateEntries,
      });
    }

    return stats;
  }

  async exportBranchComparisonExcel(
    companyId: string,
    year: number,
    month: number,
    scope?: BranchScope,
  ): Promise<ExcelJS.Buffer> {
    const stats = await this.getBranchComparison(companyId, year, month, scope);
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Şube Karşılaştırma');
    sheet.columns = [
      { header: 'Şube', key: 'name', width: 25 },
      { header: 'Personel', key: 'emp', width: 12 },
      { header: 'Bugün Gelen', key: 'present', width: 14 },
      { header: 'Çalışılan Saat', key: 'worked', width: 16 },
      { header: 'Fazla Mesai (saat)', key: 'ot', width: 18 },
      { header: 'Geç Kalma (dk)', key: 'late', width: 16 },
      { header: 'Geç Giriş Sayısı', key: 'lateCount', width: 18 },
      { header: 'Devamsız Gün', key: 'absent', width: 14 },
    ];
    for (const s of stats) {
      sheet.addRow({
        name: s.branchName,
        emp: s.employeeCount,
        present: s.presentToday,
        worked: s.totalWorkedHours,
        ot: s.totalOvertimeHours,
        late: s.totalLateMinutes,
        lateCount: s.lateEntries,
        absent: s.absentDays,
      });
    }
    return workbook.xlsx.writeBuffer();
  }

  async getAbsenceAlerts(companyId: string, scope?: BranchScope) {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const allowed = this.scopedBranchIds(scope);

    const employees = await this.prisma.employee.findMany({
      where: {
        companyId,
        isActive: true,
        ...(allowed ? { branchId: { in: allowed.length ? allowed : ['__none__'] } } : {}),
        shifts: {
          some: {
            shiftTemplate: { dayOfWeek },
            effectiveFrom: { lte: now },
            OR: [{ effectiveTo: null }, { effectiveTo: { gte: todayStart } }],
          },
        },
      },
      include: {
        user: { select: { firstName: true, lastName: true } },
        branch: { select: { id: true, name: true } },
      },
    });

    const absentees = [];
    for (const emp of employees) {
      const checkedIn = await this.prisma.attendanceRecord.count({
        where: {
          employeeId: emp.id,
          type: 'CHECK_IN',
          serverTimestamp: { gte: todayStart, lt: todayEnd },
        },
      });
      const onLeave = await this.prisma.leaveRequest.count({
        where: {
          employeeId: emp.id,
          status: 'APPROVED',
          startDate: { lte: todayEnd },
          endDate: { gte: todayStart },
        },
      });
      if (!checkedIn && !onLeave) {
        absentees.push({
          employeeId: emp.id,
          name: `${emp.user.firstName} ${emp.user.lastName}`,
          branchId: emp.branch?.id ?? null,
          branchName: emp.branch?.name ?? null,
        });
      }
    }
    return absentees;
  }

  private tickAbsenceScheduler() {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    if (now.getHours() !== 11) return;
    if (this.lastAlertDate === today) return;
    this.lastAlertDate = today;
    this.runDailyAbsenceCheck().catch((err) =>
      this.logger.error(`Devamsızlık kontrolü hatası: ${err}`),
    );
  }

  async runDailyAbsenceCheck() {
    const companies = await this.prisma.company.findMany({ select: { id: true } });
    for (const company of companies) {
      const absentees = await this.getAbsenceAlerts(company.id);
      if (!absentees.length) continue;

      const managers = await this.prisma.user.findMany({
        where: {
          companyId: company.id,
          isActive: true,
          role: { in: ['COMPANY_ADMIN', 'HR_MANAGER'] },
        },
        select: { id: true },
      });

      const names = absentees.map((a) => a.name).join(', ');
      const body = `Bugün giriş yapmayan ${absentees.length} personel: ${names}`;
      for (const m of managers) {
        await this.notifications
          .notifyUser(company.id, m.id, 'Devamsızlık Uyarısı', body, 'ABSENCE_ALERT', {
            count: absentees.length,
          })
          .catch(() => undefined);
      }
    }
  }
}
