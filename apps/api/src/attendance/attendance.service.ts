import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CheckInInput, MAX_CLOCK_SKEW_SECONDS } from '@qr/shared';
import { isWithinGeofence, haversineDistanceM } from '../common/utils';
import {
  AttendanceType,
  AttendanceMode,
  DeviceStatus,
  AttendanceStatus,
  BranchTransferStatus,
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BranchScope } from '../common/decorators';
import { branchWhere, canAccessBranch } from '../common/branch-scope';
import { verifyBranchQrToken } from '../common/qr';

type BranchRow = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  geofenceRadiusM: number;
  qrSecret: string | null;
};

@Injectable()
export class AttendanceService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private notifications: NotificationsService,
  ) {}

  /** Employee's currently allowed branch ids: assigned branch + active transfers covering now. */
  private async allowedBranchIds(employeeId: string, assignedBranchId: string | null): Promise<Set<string>> {
    const allowed = new Set<string>();
    if (assignedBranchId) allowed.add(assignedBranchId);
    const now = new Date();
    const transfers = await this.prisma.branchTransfer.findMany({
      where: {
        employeeId,
        status: BranchTransferStatus.ACTIVE,
        effectiveFrom: { lte: now },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
      },
      select: { toBranchId: true },
    });
    transfers.forEach((t) => allowed.add(t.toBranchId));
    return allowed;
  }

  private isMealType(type: AttendanceType) {
    return type === AttendanceType.MEAL_START || type === AttendanceType.MEAL_END;
  }

  private assertStateMachine(type: AttendanceType, lastType: AttendanceType | undefined, mealEnabled: boolean) {
    if (type === AttendanceType.CHECK_IN) {
      if (lastType && lastType !== AttendanceType.CHECK_OUT) {
        throw new BadRequestException('Zaten giriş yapmışsınız. Önce çıkış yapın.');
      }
      return;
    }
    if (type === AttendanceType.MEAL_START) {
      if (!mealEnabled) throw new BadRequestException('Yemek molası bu şirkette kapalı');
      if (lastType !== AttendanceType.CHECK_IN && lastType !== AttendanceType.MEAL_END) {
        throw new BadRequestException('Yemeğe çıkmak için önce giriş yapmalısınız');
      }
      return;
    }
    if (type === AttendanceType.MEAL_END) {
      if (!mealEnabled) throw new BadRequestException('Yemek molası bu şirkette kapalı');
      if (lastType !== AttendanceType.MEAL_START) {
        throw new BadRequestException('Önce yemeğe çıkış yapmalısınız');
      }
      return;
    }
    // CHECK_OUT
    if (!lastType || lastType === AttendanceType.CHECK_OUT) {
      throw new BadRequestException('Önce giriş yapmalısınız');
    }
    if (lastType === AttendanceType.MEAL_START) {
      throw new BadRequestException('Yemekteyken çıkış yapılamaz. Önce yemekten dönün.');
    }
  }

  private pickNearestBranch(
    branches: BranchRow[],
    latitude: number,
    longitude: number,
  ): { nearest: BranchRow; dist: number } {
    let nearest = branches[0];
    let nearestDist = haversineDistanceM(latitude, longitude, nearest.latitude, nearest.longitude);
    for (const b of branches.slice(1)) {
      const d = haversineDistanceM(latitude, longitude, b.latitude, b.longitude);
      if (d < nearestDist) {
        nearest = b;
        nearestDist = d;
      }
    }
    return { nearest, dist: nearestDist };
  }

  private async resolveBranchViaQr(
    companyId: string,
    companyQrToken: string,
    qrToken: string,
    branches: BranchRow[],
    requireLocation: boolean,
    latitude: number | undefined,
    longitude: number | undefined,
    employeeId: string,
  ): Promise<{ nearest: BranchRow; withinGeofence: boolean }> {
    let parsedQr: { type?: string; companyId?: string; branchId?: string; token?: string };
    try {
      parsedQr = JSON.parse(qrToken);
    } catch {
      throw new BadRequestException('Geçersiz QR kodu');
    }

    if (parsedQr.companyId !== companyId) {
      throw new BadRequestException('QR kodu bu şirkete ait değil');
    }

    let nearest: BranchRow;
    if (parsedQr.type === 'branch' && parsedQr.branchId) {
      const scanned = branches.find((b) => b.id === parsedQr.branchId);
      if (!scanned) throw new BadRequestException('QR kodundaki şube bulunamadı');
      if (!scanned.qrSecret || !parsedQr.token || !verifyBranchQrToken(scanned.qrSecret, parsedQr.token)) {
        throw new BadRequestException('QR kodu geçersiz veya süresi dolmuş');
      }
      nearest = scanned;
    } else {
      if (parsedQr.token !== companyQrToken) {
        throw new BadRequestException('QR kodu bu şirkete ait değil');
      }
      if (requireLocation && latitude != null && longitude != null) {
        nearest = this.pickNearestBranch(branches, latitude, longitude).nearest;
      } else {
        const employee = await this.prisma.employee.findUniqueOrThrow({
          where: { id: employeeId },
          select: { branchId: true },
        });
        nearest = branches.find((b) => b.id === employee.branchId) ?? branches[0];
      }
    }

    let withinGeofence = true;
    if (requireLocation) {
      if (latitude == null || longitude == null) {
        throw new BadRequestException('Konum bilgisi gerekli');
      }
      withinGeofence = isWithinGeofence(
        latitude,
        longitude,
        nearest.latitude,
        nearest.longitude,
        nearest.geofenceRadiusM,
      );
      if (!withinGeofence) {
        throw new ForbiddenException('Konumunuz herhangi bir şube alanı dışında');
      }
    }

    return { nearest, withinGeofence };
  }

  private resolveBranchViaLocation(
    branches: BranchRow[],
    latitude: number,
    longitude: number,
  ): { nearest: BranchRow; withinGeofence: boolean } {
    const { nearest } = this.pickNearestBranch(branches, latitude, longitude);
    const withinGeofence = isWithinGeofence(
      latitude,
      longitude,
      nearest.latitude,
      nearest.longitude,
      nearest.geofenceRadiusM,
    );
    if (!withinGeofence) {
      throw new ForbiddenException('Konumunuz herhangi bir şube alanı dışında');
    }
    return { nearest, withinGeofence };
  }

  private async mealMinutesToday(employeeId: string, companyId: string): Promise<number> {
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date();
    dayEnd.setHours(23, 59, 59, 999);

    const records = await this.prisma.attendanceRecord.findMany({
      where: {
        employeeId,
        companyId,
        status: AttendanceStatus.APPROVED,
        serverTimestamp: { gte: dayStart, lte: dayEnd },
        type: { in: [AttendanceType.MEAL_START, AttendanceType.MEAL_END] },
      },
      orderBy: { serverTimestamp: 'asc' },
    });

    let total = 0;
    let openStart: Date | null = null;
    for (const r of records) {
      if (r.type === AttendanceType.MEAL_START) {
        openStart = r.serverTimestamp;
      } else if (r.type === AttendanceType.MEAL_END && openStart) {
        total += Math.round((r.serverTimestamp.getTime() - openStart.getTime()) / 60000);
        openStart = null;
      }
    }
    if (openStart) {
      total += Math.round((Date.now() - openStart.getTime()) / 60000);
    }
    return total;
  }

  async checkInOut(
    employeeId: string,
    companyId: string,
    userId: string,
    dto: CheckInInput,
  ) {
    const platform = await this.prisma.platformSettings.findUnique({ where: { id: 'default' } });
    const requireLocation = platform?.requireEmployeeLocation ?? true;
    const isMeal = this.isMealType(dto.type);

    const company = await this.prisma.company.findUniqueOrThrow({
      where: { id: companyId },
    });

    const clientTime = new Date(dto.clientTimestamp);
    const skew = Math.abs(Date.now() - clientTime.getTime()) / 1000;
    if (skew > MAX_CLOCK_SKEW_SECONDS) {
      throw new BadRequestException('Cihaz saati güvenilir değil');
    }

    if (company.deviceBindingEnabled) {
      await this.validateDevice(employeeId, dto.deviceId);
    }

    const employee = await this.prisma.employee.findUniqueOrThrow({
      where: { id: employeeId },
      include: { user: { select: { firstName: true, lastName: true } } },
    });

    const lastRecord = await this.prisma.attendanceRecord.findFirst({
      where: { employeeId, companyId, status: AttendanceStatus.APPROVED },
      orderBy: { serverTimestamp: 'desc' },
    });

    this.assertStateMachine(dto.type, lastRecord?.type, company.mealBreakEnabled);

    const branches = await this.prisma.branch.findMany({
      where: { companyId, isActive: true },
    });
    if (branches.length === 0) throw new NotFoundException('Aktif şube bulunamadı');

    let nearest: BranchRow;
    let withinGeofence = true;
    let recordLatitude: number;
    let recordLongitude: number;
    let isOffBranch = false;

    if (isMeal) {
      // Meal: no QR / geofence; use last approved branch or assigned branch
      const branchId =
        lastRecord?.branchId ??
        employee.branchId ??
        branches[0].id;
      nearest = branches.find((b) => b.id === branchId) ?? branches[0];
      recordLatitude = dto.latitude ?? nearest.latitude;
      recordLongitude = dto.longitude ?? nearest.longitude;
    } else if (company.attendanceMode === AttendanceMode.LOCATION) {
      if (dto.latitude == null || dto.longitude == null) {
        throw new BadRequestException('Konum bilgisi gerekli');
      }
      const resolved = this.resolveBranchViaLocation(branches, dto.latitude, dto.longitude);
      nearest = resolved.nearest;
      withinGeofence = resolved.withinGeofence;
      recordLatitude = dto.latitude;
      recordLongitude = dto.longitude;
      const allowed = await this.allowedBranchIds(employeeId, employee.branchId);
      isOffBranch = !allowed.has(nearest.id);
    } else {
      // QR mode
      if (!dto.qrToken) {
        throw new BadRequestException('QR kodu gerekli');
      }
      if (requireLocation && (dto.latitude == null || dto.longitude == null)) {
        throw new BadRequestException('Konum bilgisi gerekli');
      }
      const resolved = await this.resolveBranchViaQr(
        companyId,
        company.qrToken,
        dto.qrToken,
        branches,
        requireLocation,
        dto.latitude,
        dto.longitude,
        employeeId,
      );
      nearest = resolved.nearest;
      withinGeofence = resolved.withinGeofence;
      recordLatitude = dto.latitude ?? nearest.latitude;
      recordLongitude = dto.longitude ?? nearest.longitude;
      const allowed = await this.allowedBranchIds(employeeId, employee.branchId);
      isOffBranch = !allowed.has(nearest.id);
    }

    let mealOverLimit = false;
    let mealMinutesToday = 0;
    if (dto.type === AttendanceType.MEAL_END) {
      mealMinutesToday = await this.mealMinutesToday(employeeId, companyId);
      // Include the just-ending open meal: mealMinutesToday already counts open START→now
      if (mealMinutesToday > company.mealBreakLimitMinutes) {
        mealOverLimit = true;
      }
    }

    const record = await this.prisma.attendanceRecord.create({
      data: {
        companyId,
        employeeId,
        branchId: nearest.id,
        type: dto.type,
        clientTimestamp: clientTime,
        latitude: recordLatitude,
        longitude: recordLongitude,
        accuracy: dto.accuracy,
        withinGeofence,
        deviceId: dto.deviceId,
        status: isOffBranch ? AttendanceStatus.PENDING : AttendanceStatus.APPROVED,
        isOffBranch,
        notes: isOffBranch
          ? dto.offBranchReason ?? null
          : mealOverLimit
            ? `Yemek limiti aşıldı (${mealMinutesToday}/${company.mealBreakLimitMinutes} dk)`
            : null,
      },
      include: {
        branch: { select: { name: true } },
      },
    });

    if (isOffBranch) {
      await this.notifyOffBranch(
        companyId,
        nearest.id,
        nearest.name,
        employee.user.firstName,
        employee.user.lastName,
        record.id,
      );
    }

    if (mealOverLimit) {
      await this.notifyMealOver(
        companyId,
        nearest.id,
        employee.user.firstName,
        employee.user.lastName,
        mealMinutesToday,
        company.mealBreakLimitMinutes,
      );
    }

    return {
      ...record,
      offBranchPending: isOffBranch,
      mealOverLimit,
      mealMinutesToday: dto.type === AttendanceType.MEAL_END ? mealMinutesToday : undefined,
      mealBreakLimitMinutes: company.mealBreakLimitMinutes,
      message: isOffBranch
        ? `Görev yeriniz dışındaki "${nearest.name}" şubesinde giriş yaptınız. Yönetici onayı bekleniyor.`
        : mealOverLimit
          ? `Yemek süreniz limiti aştı (${mealMinutesToday}/${company.mealBreakLimitMinutes} dk).`
          : undefined,
    };
  }

  private async notifyMealOver(
    companyId: string,
    branchId: string,
    firstName: string,
    lastName: string,
    minutes: number,
    limit: number,
  ) {
    const managers = await this.prisma.user.findMany({
      where: {
        companyId,
        isActive: true,
        OR: [
          { role: { in: ['COMPANY_ADMIN', 'HR_MANAGER'] } },
          { branchAssignments: { some: { branchId } } },
        ],
      },
      select: { id: true },
    });
    await Promise.all(
      managers.map((m) =>
        this.notifications.notifyUser(
          companyId,
          m.id,
          'Yemek Süresi Aşımı',
          `${firstName} ${lastName} yemek limitini aştı (${minutes}/${limit} dk)`,
          'ATTENDANCE_MEAL_OVER',
          { minutes, limit },
        ),
      ),
    );
  }

  private async notifyOffBranch(
    companyId: string,
    branchId: string,
    branchName: string,
    firstName: string,
    lastName: string,
    recordId: string,
  ) {
    const managers = await this.prisma.user.findMany({
      where: {
        companyId,
        isActive: true,
        OR: [
          { role: { in: ['COMPANY_ADMIN', 'HR_MANAGER'] } },
          { branchAssignments: { some: { branchId } } },
        ],
      },
      select: { id: true },
    });
    await Promise.all(
      managers.map((m) =>
        this.notifications.notifyUser(
          companyId,
          m.id,
          'Şube Dışı Giriş Onayı',
          `${firstName} ${lastName} "${branchName}" şubesinde onay bekliyor`,
          'ATTENDANCE_OFF_BRANCH',
          { recordId },
        ),
      ),
    );
  }

  async listPendingApprovals(companyId: string, scope?: BranchScope) {
    return this.prisma.attendanceRecord.findMany({
      where: {
        companyId,
        status: AttendanceStatus.PENDING,
        isOffBranch: true,
        ...branchWhere(scope),
      },
      include: {
        employee: { include: { user: { select: { firstName: true, lastName: true } } } },
        branch: { select: { name: true } },
      },
      orderBy: { serverTimestamp: 'desc' },
    });
  }

  async reviewRecord(
    companyId: string,
    recordId: string,
    reviewerId: string,
    approve: boolean,
    note?: string,
    scope?: BranchScope,
  ) {
    const record = await this.prisma.attendanceRecord.findFirst({
      where: { id: recordId, companyId },
    });
    if (!record) throw new NotFoundException('Kayıt bulunamadı');
    if (!canAccessBranch(scope, record.branchId)) {
      throw new ForbiddenException('Bu kaydı inceleme yetkiniz yok');
    }

    const updated = await this.prisma.attendanceRecord.update({
      where: { id: recordId },
      data: {
        status: approve ? AttendanceStatus.APPROVED : AttendanceStatus.REJECTED,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        reviewNote: note,
      },
    });

    await this.notifications.notifyEmployee(
      companyId,
      record.employeeId,
      approve ? 'Giriş Onaylandı' : 'Giriş Reddedildi',
      note || (approve ? 'Şube dışı girişiniz onaylandı' : 'Şube dışı girişiniz reddedildi'),
      'ATTENDANCE_REVIEW',
    );

    await this.audit.log({
      companyId,
      actorId: reviewerId,
      action: approve ? 'ATTENDANCE_APPROVE' : 'ATTENDANCE_REJECT',
      entityType: 'AttendanceRecord',
      entityId: recordId,
    });

    return updated;
  }

  private async validateDevice(employeeId: string, deviceId: string) {
    const existing = await this.prisma.employeeDevice.findUnique({
      where: { employeeId_deviceId: { employeeId, deviceId } },
    });

    if (!existing) {
      const approved = await this.prisma.employeeDevice.findFirst({
        where: { employeeId, status: DeviceStatus.APPROVED },
      });
      if (approved) {
        await this.prisma.employeeDevice.create({
          data: { employeeId, deviceId, status: DeviceStatus.PENDING },
        });
        throw new ForbiddenException(
          'Bu cihaz tanınmıyor. Yönetici onayı bekleniyor.',
        );
      }
      await this.prisma.employeeDevice.create({
        data: { employeeId, deviceId, status: DeviceStatus.APPROVED, approvedAt: new Date() },
      });
      return;
    }

    if (existing.status === DeviceStatus.PENDING) {
      throw new ForbiddenException('Cihaz onayı bekleniyor');
    }
    if (existing.status === DeviceStatus.REJECTED) {
      throw new ForbiddenException('Bu cihaz reddedildi');
    }
  }

  async getMyRecords(employeeId: string, from?: string, to?: string) {
    const where: { employeeId: string; serverTimestamp?: { gte?: Date; lte?: Date } } = {
      employeeId,
    };
    if (from || to) {
      where.serverTimestamp = {};
      if (from) where.serverTimestamp.gte = new Date(from);
      if (to) where.serverTimestamp.lte = new Date(to);
    }
    return this.prisma.attendanceRecord.findMany({
      where,
      orderBy: { serverTimestamp: 'desc' },
      include: { branch: { select: { name: true } } },
    });
  }

  async manualAdjust(
    companyId: string,
    actorId: string,
    data: {
      employeeId: string;
      branchId: string;
      type: AttendanceType;
      timestamp: string;
      reason: string;
    },
  ) {
    const record = await this.prisma.attendanceRecord.create({
      data: {
        companyId,
        employeeId: data.employeeId,
        branchId: data.branchId,
        type: data.type,
        serverTimestamp: new Date(data.timestamp),
        clientTimestamp: new Date(data.timestamp),
        latitude: 0,
        longitude: 0,
        withinGeofence: true,
        isManual: true,
        manualReason: data.reason,
      },
    });

    await this.audit.log({
      companyId,
      actorId,
      action: 'ATTENDANCE_MANUAL_ADJUST',
      entityType: 'AttendanceRecord',
      entityId: record.id,
      metadata: data,
    });

    return record;
  }

  async listByCompany(companyId: string, date?: string, scope?: BranchScope) {
    const day = date ? new Date(date) : new Date();
    day.setHours(0, 0, 0, 0);
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);

    return this.prisma.attendanceRecord.findMany({
      where: {
        companyId,
        serverTimestamp: { gte: day, lt: nextDay },
        ...branchWhere(scope),
      },
      include: {
        employee: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        branch: { select: { name: true } },
      },
      orderBy: { serverTimestamp: 'desc' },
    });
  }
}
