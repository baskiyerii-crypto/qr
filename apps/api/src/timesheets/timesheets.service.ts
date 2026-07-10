import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceType } from '@prisma/client';
import { BranchScope } from '../common/decorators';
import { resolveBranchFilter } from '../common/branch-scope';

@Injectable()
export class TimesheetsService {
  constructor(private prisma: PrismaService) {}

  async calculateForEmployee(employeeId: string, year: number, month: number) {
    const employee = await this.prisma.employee.findUniqueOrThrow({
      where: { id: employeeId },
      include: { company: true },
    });
    const company = employee.company;

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    const daysInMonth = end.getDate();

    const shifts = await this.prisma.employeeShift.findMany({
      where: { employeeId },
      include: { shiftTemplate: true },
    });

    const standardWorkDays =
      company.workScheduleMode === 'STANDARD'
        ? company.standardWorkDays.split(',').map(Number)
        : [];

    const resolvePlannedMinutes = (dayOfWeek: number) => {
      const shift = shifts.find((s) => s.shiftTemplate.dayOfWeek === dayOfWeek);
      if (shift) {
        const [sh, sm] = shift.shiftTemplate.startTime.split(':').map(Number);
        const [eh, em] = shift.shiftTemplate.endTime.split(':').map(Number);
        return {
          plannedMinutes: eh * 60 + em - (sh * 60 + sm),
          startTime: shift.shiftTemplate.startTime,
          endTime: shift.shiftTemplate.endTime,
        };
      }
      if (company.workScheduleMode === 'STANDARD' && standardWorkDays.includes(dayOfWeek)) {
        const [sh, sm] = company.standardStartTime.split(':').map(Number);
        const [eh, em] = company.standardEndTime.split(':').map(Number);
        return {
          plannedMinutes: eh * 60 + em - (sh * 60 + sm),
          startTime: company.standardStartTime,
          endTime: company.standardEndTime,
        };
      }
      return { plannedMinutes: 0, startTime: null as string | null, endTime: null as string | null };
    };

    const leaves = await this.prisma.leaveRequest.findMany({
      where: {
        employeeId,
        status: 'APPROVED',
        startDate: { lte: end },
        endDate: { gte: start },
      },
    });

    const records = await this.prisma.attendanceRecord.findMany({
      where: {
        employeeId,
        serverTimestamp: { gte: start, lte: new Date(year, month, 1) },
      },
      orderBy: { serverTimestamp: 'asc' },
    });

    const entries = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month - 1, d);
      const dayOfWeek = date.getDay();
      const { plannedMinutes, startTime, endTime } = resolvePlannedMinutes(dayOfWeek);
      const onLeave = leaves.some(
        (l) => date >= l.startDate && date <= l.endDate,
      );

      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const dayRecords = records.filter(
        (r) => r.serverTimestamp >= dayStart && r.serverTimestamp <= dayEnd,
      );

      let workedMinutes = 0;
      let lateMinutes = 0;
      let earlyLeaveMinutes = 0;

      const checkIn = dayRecords.find((r) => r.type === AttendanceType.CHECK_IN);
      const checkOut = dayRecords.find((r) => r.type === AttendanceType.CHECK_OUT);

      if (checkIn && checkOut) {
        workedMinutes = Math.round(
          (checkOut.serverTimestamp.getTime() - checkIn.serverTimestamp.getTime()) / 60000,
        );
        if (startTime && endTime) {
          const [sh, sm] = startTime.split(':').map(Number);
          const plannedStart = new Date(date);
          plannedStart.setHours(sh, sm, 0, 0);
          const late = Math.round(
            (checkIn.serverTimestamp.getTime() - plannedStart.getTime()) / 60000,
          );
          if (late > 5) lateMinutes = late;

          const [eh, em] = endTime.split(':').map(Number);
          const plannedEnd = new Date(date);
          plannedEnd.setHours(eh, em, 0, 0);
          const early = Math.round(
            (plannedEnd.getTime() - checkOut.serverTimestamp.getTime()) / 60000,
          );
          if (early > 5) earlyLeaveMinutes = early;
        }
      }

      const missingMinutes = onLeave
        ? 0
        : Math.max(0, plannedMinutes - workedMinutes);
      const overtimeMinutes = Math.max(0, workedMinutes - plannedMinutes);
      const isAbsent = !onLeave && plannedMinutes > 0 && !checkIn;

      const entry = await this.prisma.timesheetEntry.upsert({
        where: { employeeId_date: { employeeId, date } },
        create: {
          employeeId,
          date,
          plannedMinutes,
          workedMinutes,
          lateMinutes,
          earlyLeaveMinutes,
          overtimeMinutes,
          missingMinutes,
          isAbsent,
          isOnLeave: onLeave,
        },
        update: {
          plannedMinutes,
          workedMinutes,
          lateMinutes,
          earlyLeaveMinutes,
          overtimeMinutes,
          missingMinutes,
          isAbsent,
          isOnLeave: onLeave,
        },
      });
      entries.push(entry);
    }

    return entries;
  }

  async getSummary(employeeId: string, year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);

    const entries = await this.prisma.timesheetEntry.findMany({
      where: { employeeId, date: { gte: start, lte: end } },
    });

    return {
      totalWorkedMinutes: entries.reduce((s, e) => s + e.workedMinutes, 0),
      totalOvertimeMinutes: entries.reduce((s, e) => s + e.overtimeMinutes, 0),
      totalMissingMinutes: entries.reduce((s, e) => s + e.missingMinutes, 0),
      totalLateMinutes: entries.reduce((s, e) => s + e.lateMinutes, 0),
      absentDays: entries.filter((e) => e.isAbsent).length,
      leaveDays: entries.filter((e) => e.isOnLeave).length,
      entries,
    };
  }

  async getCompanyTimesheet(companyId: string, year: number, month: number, scope?: BranchScope) {
    const { where: branchFilter } = resolveBranchFilter(scope);
    const employees = await this.prisma.employee.findMany({
      where: { companyId, isActive: true, ...branchFilter },
      include: { user: { select: { firstName: true, lastName: true } } },
    });

    const results = [];
    for (const emp of employees) {
      const summary = await this.getSummary(emp.id, year, month);
      results.push({ employee: emp, summary });
    }
    return results;
  }
}
