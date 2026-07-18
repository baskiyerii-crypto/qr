import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AttendanceType, AttendanceStatus } from '@prisma/client';

type ReminderSlot = 'IN' | 'OUT' | 'LATE';

@Injectable()
export class AttendanceRemindersService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AttendanceRemindersService.name);
  private timer: ReturnType<typeof setInterval> | null = null;
  /** Dedupe key → already sent today */
  private sent = new Set<string>();
  private lastDay = '';

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  onModuleInit() {
    this.timer = setInterval(() => this.tick(), 5 * 60 * 1000);
    // First run shortly after boot
    setTimeout(() => this.tick(), 15_000);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private dayKey(d = new Date()) {
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  private resetIfNewDay() {
    const today = this.dayKey();
    if (this.lastDay !== today) {
      this.lastDay = today;
      this.sent.clear();
    }
  }

  private parseHm(hm: string): { h: number; m: number } {
    const [h, m] = hm.split(':').map(Number);
    return { h, m };
  }

  private minutesOfDay(d: Date) {
    return d.getHours() * 60 + d.getMinutes();
  }

  private async alreadyNotified(
    companyId: string,
    employeeId: string,
    type: string,
    slotKey: string,
  ): Promise<boolean> {
    const memKey = `${companyId}:${employeeId}:${type}:${slotKey}:${this.dayKey()}`;
    if (this.sent.has(memKey)) return true;

    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const existing = await this.prisma.notification.findFirst({
      where: {
        companyId,
        employeeId,
        type,
        createdAt: { gte: dayStart },
      },
      select: { id: true, data: true },
    });
    if (existing) {
      const data = existing.data as { slotKey?: string } | null;
      if (!data?.slotKey || data.slotKey === slotKey) {
        this.sent.add(memKey);
        return true;
      }
    }
    return false;
  }

  private markSent(companyId: string, employeeId: string, type: string, slotKey: string) {
    this.sent.add(`${companyId}:${employeeId}:${type}:${slotKey}:${this.dayKey()}`);
  }

  async tick() {
    this.resetIfNewDay();
    try {
      await this.runReminders();
    } catch (err) {
      this.logger.error(`Hatırlatma kontrolü hatası: ${err}`);
    }
  }

  async runReminders() {
    const now = new Date();
    const nowMin = this.minutesOfDay(now);
    const dayOfWeek = now.getDay();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const companies = await this.prisma.company.findMany({
      where: { attendanceRemindersEnabled: true },
    });

    for (const company of companies) {
      const before = company.reminderMinutesBefore ?? 10;
      const standardDays =
        company.workScheduleMode === 'STANDARD'
          ? company.standardWorkDays.split(',').map(Number)
          : [];

      const employees = await this.prisma.employee.findMany({
        where: { companyId: company.id, isActive: true },
        include: {
          user: { select: { firstName: true, lastName: true } },
          shifts: {
            where: {
              OR: [{ effectiveTo: null }, { effectiveTo: { gte: todayStart } }],
              effectiveFrom: { lte: todayEnd },
            },
            include: { shiftTemplate: true },
          },
        },
      });

      for (const emp of employees) {
        let startHm: string | null = null;
        let endHm: string | null = null;

        const shiftToday = emp.shifts.find((s) => s.shiftTemplate.dayOfWeek === dayOfWeek);
        if (shiftToday) {
          startHm = shiftToday.shiftTemplate.startTime;
          endHm = shiftToday.shiftTemplate.endTime;
        } else if (
          company.workScheduleMode === 'STANDARD' &&
          standardDays.includes(dayOfWeek)
        ) {
          startHm = company.standardStartTime;
          endHm = company.standardEndTime;
        }

        if (!startHm || !endHm) continue;

        const onLeave = await this.prisma.leaveRequest.count({
          where: {
            employeeId: emp.id,
            status: 'APPROVED',
            startDate: { lte: todayEnd },
            endDate: { gte: todayStart },
          },
        });
        if (onLeave) continue;

        const start = this.parseHm(startHm);
        const end = this.parseHm(endHm);
        const startMin = start.h * 60 + start.m;
        const endMin = end.h * 60 + end.m;

        const hasCheckIn = await this.prisma.attendanceRecord.count({
          where: {
            employeeId: emp.id,
            type: AttendanceType.CHECK_IN,
            status: { in: [AttendanceStatus.APPROVED, AttendanceStatus.PENDING] },
            serverTimestamp: { gte: todayStart, lte: todayEnd },
          },
        });

        const lastRecord = await this.prisma.attendanceRecord.findFirst({
          where: {
            employeeId: emp.id,
            status: AttendanceStatus.APPROVED,
            serverTimestamp: { gte: todayStart, lte: todayEnd },
          },
          orderBy: { serverTimestamp: 'desc' },
        });

        const isInside =
          !!lastRecord &&
          lastRecord.type !== AttendanceType.CHECK_OUT;

        // Pre-shift check-in reminder
        if (!hasCheckIn && nowMin >= startMin - before && nowMin < startMin) {
          await this.send(
            company.id,
            emp.id,
            'ATTENDANCE_REMINDER_IN',
            'IN',
            'Giriş Hatırlatması',
            `Mesainiz ${startHm}'de başlıyor. Giriş yapmayı unutmayın.`,
          );
        }

        // Late check-in (15 min after start)
        if (!hasCheckIn && nowMin >= startMin + 15 && nowMin < startMin + 20) {
          await this.send(
            company.id,
            emp.id,
            'ATTENDANCE_REMINDER_LATE',
            'LATE',
            'Giriş Yapılmadı',
            `Mesainiz ${startHm}'de başladı. Henüz giriş kaydınız yok.`,
          );
        }

        // End-of-shift check-out reminder
        if (isInside && nowMin >= endMin && nowMin < endMin + 15) {
          await this.send(
            company.id,
            emp.id,
            'ATTENDANCE_REMINDER_OUT',
            'OUT',
            'Çıkış Hatırlatması',
            `Mesai bitiş saatiniz ${endHm}. Çıkış yapmayı unutmayın.`,
          );
        }
      }
    }
  }

  private async send(
    companyId: string,
    employeeId: string,
    type: string,
    slot: ReminderSlot,
    title: string,
    body: string,
  ) {
    const slotKey = slot;
    if (await this.alreadyNotified(companyId, employeeId, type, slotKey)) return;
    await this.notifications.notifyEmployee(companyId, employeeId, title, body, type, {
      slotKey,
    });
    this.markSent(companyId, employeeId, type, slotKey);
  }
}
