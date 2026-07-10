import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CheckInInput, MAX_CLOCK_SKEW_SECONDS } from '@qr/shared';
import { isWithinGeofence, haversineDistanceM } from '../common/utils';
import { AttendanceType, DeviceStatus, AttendanceStatus, BranchTransferStatus } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BranchScope } from '../common/decorators';
import { branchWhere, canAccessBranch } from '../common/branch-scope';
import { verifyBranchQrToken } from '../common/qr';

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

  async checkInOut(
    employeeId: string,
    companyId: string,
    userId: string,
    dto: CheckInInput,
  ) {
    const platform = await this.prisma.platformSettings.findUnique({ where: { id: 'default' } });
    const requireLocation = platform?.requireEmployeeLocation ?? true;

    if (requireLocation && (dto.latitude == null || dto.longitude == null)) {
      throw new BadRequestException('Konum bilgisi gerekli');
    }

    const company = await this.prisma.company.findUniqueOrThrow({
      where: { id: companyId },
    });

    let parsedQr: { type?: string; companyId?: string; branchId?: string; token?: string };
    try {
      parsedQr = JSON.parse(dto.qrToken);
    } catch {
      throw new BadRequestException('Geçersiz QR kodu');
    }

    if (parsedQr.companyId !== companyId) {
      throw new BadRequestException('QR kodu bu şirkete ait değil');
    }

    const branches = await this.prisma.branch.findMany({
      where: { companyId, isActive: true },
    });
    if (branches.length === 0) throw new NotFoundException('Aktif şube bulunamadı');

    let nearest;
    if (parsedQr.type === 'branch' && parsedQr.branchId) {
      // Dinamik şube QR'ı: taranan şube ve zaman pencereli token doğrulaması
      const scanned = branches.find((b) => b.id === parsedQr.branchId);
      if (!scanned) throw new BadRequestException('QR kodundaki şube bulunamadı');
      if (!scanned.qrSecret || !parsedQr.token || !verifyBranchQrToken(scanned.qrSecret, parsedQr.token)) {
        throw new BadRequestException('QR kodu geçersiz veya süresi dolmuş');
      }
      nearest = scanned;
    } else {
      // Eski şirket QR'ı (geriye dönük uyumluluk): statik token + konumdan en yakın şube
      if (parsedQr.token !== company.qrToken) {
        throw new BadRequestException('QR kodu bu şirkete ait değil');
      }
      if (requireLocation) {
        nearest = branches[0];
        let nearestDist = haversineDistanceM(dto.latitude!, dto.longitude!, nearest.latitude, nearest.longitude);
        for (const b of branches.slice(1)) {
          const d = haversineDistanceM(dto.latitude!, dto.longitude!, b.latitude, b.longitude);
          if (d < nearestDist) {
            nearest = b;
            nearestDist = d;
          }
        }
      } else {
        const employee = await this.prisma.employee.findUniqueOrThrow({
          where: { id: employeeId },
          select: { branchId: true },
        });
        nearest =
          branches.find((b) => b.id === employee.branchId) ?? branches[0];
      }
    }

    let withinGeofence = true;
    let recordLatitude = dto.latitude ?? nearest.latitude;
    let recordLongitude = dto.longitude ?? nearest.longitude;

    if (requireLocation) {
      withinGeofence = isWithinGeofence(
        dto.latitude!,
        dto.longitude!,
        nearest.latitude,
        nearest.longitude,
        nearest.geofenceRadiusM,
      );
      if (!withinGeofence) {
        throw new ForbiddenException('Konumunuz herhangi bir şube alanı dışında');
      }
    }

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

    const allowed = await this.allowedBranchIds(employeeId, employee.branchId);
    const isOffBranch = !allowed.has(nearest.id);

    const lastRecord = await this.prisma.attendanceRecord.findFirst({
      where: { employeeId, companyId, status: AttendanceStatus.APPROVED },
      orderBy: { serverTimestamp: 'desc' },
    });

    if (dto.type === AttendanceType.CHECK_IN) {
      if (lastRecord?.type === AttendanceType.CHECK_IN) {
        throw new BadRequestException('Zaten giriş yapmışsınız. Önce çıkış yapın.');
      }
    } else {
      if (!lastRecord || lastRecord.type === AttendanceType.CHECK_OUT) {
        throw new BadRequestException('Önce giriş yapmalısınız');
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
        notes: isOffBranch ? dto.offBranchReason ?? null : null,
      },
      include: {
        branch: { select: { name: true } },
      },
    });

    if (isOffBranch) {
      await this.notifyOffBranch(companyId, nearest.id, nearest.name, employee.user.firstName, employee.user.lastName, record.id);
    }

    return {
      ...record,
      offBranchPending: isOffBranch,
      message: isOffBranch
        ? `Görev yeriniz dışındaki "${nearest.name}" şubesinde giriş yaptınız. Yönetici onayı bekleniyor.`
        : undefined,
    };
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
