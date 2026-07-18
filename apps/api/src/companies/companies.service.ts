import { Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBranchInput, CompanySettingsInput, QR_ROTATION_WINDOW_SECONDS } from '@qr/shared';
import { AttendanceMode, WorkScheduleMode } from '@prisma/client';
import { BranchScope } from '../common/decorators';
import { canAccessBranch } from '../common/branch-scope';
import { currentQrWindow, generateBranchQrToken } from '../common/qr';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async getCompany(companyId: string) {
    const company = await this.prisma.company.findUniqueOrThrow({
      where: { id: companyId },
      include: { branches: true, departments: true },
    });
    return {
      ...company,
      standardWorkDays: company.standardWorkDays.split(',').map(Number),
    };
  }

  async updateSettings(companyId: string, data: CompanySettingsInput) {
    const update: {
      deviceBindingEnabled?: boolean;
      dataRetentionDays?: number;
      overtimeMultiplier?: number;
      workScheduleMode?: WorkScheduleMode;
      standardWorkDays?: string;
      standardStartTime?: string;
      standardEndTime?: string;
      attendanceMode?: AttendanceMode;
      mealBreakEnabled?: boolean;
      mealBreakLimitMinutes?: number;
      attendanceRemindersEnabled?: boolean;
      reminderMinutesBefore?: number;
    } = {};

    if (data.deviceBindingEnabled !== undefined) update.deviceBindingEnabled = data.deviceBindingEnabled;
    if (data.dataRetentionDays !== undefined) update.dataRetentionDays = data.dataRetentionDays;
    if (data.overtimeMultiplier !== undefined) update.overtimeMultiplier = data.overtimeMultiplier;
    if (data.workScheduleMode !== undefined) update.workScheduleMode = data.workScheduleMode;
    if (data.standardWorkDays !== undefined) update.standardWorkDays = data.standardWorkDays.join(',');
    if (data.standardStartTime !== undefined) update.standardStartTime = data.standardStartTime;
    if (data.standardEndTime !== undefined) update.standardEndTime = data.standardEndTime;
    if (data.attendanceMode !== undefined) update.attendanceMode = data.attendanceMode;
    if (data.mealBreakEnabled !== undefined) update.mealBreakEnabled = data.mealBreakEnabled;
    if (data.mealBreakLimitMinutes !== undefined) update.mealBreakLimitMinutes = data.mealBreakLimitMinutes;
    if (data.attendanceRemindersEnabled !== undefined) {
      update.attendanceRemindersEnabled = data.attendanceRemindersEnabled;
    }
    if (data.reminderMinutesBefore !== undefined) update.reminderMinutesBefore = data.reminderMinutesBefore;

    const company = await this.prisma.company.update({ where: { id: companyId }, data: update });
    return {
      ...company,
      standardWorkDays: company.standardWorkDays.split(',').map(Number),
    };
  }

  async createBranch(companyId: string, dto: CreateBranchInput) {
    return this.prisma.branch.create({
      data: { companyId, ...dto },
    });
  }

  async listBranches(companyId: string) {
    return this.prisma.branch.findMany({
      where: { companyId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async getQrData(companyId: string) {
    const company = await this.prisma.company.findUniqueOrThrow({
      where: { id: companyId },
    });
    const payload = JSON.stringify({
      type: 'company',
      companyId: company.id,
      token: company.qrToken,
    });
    const qrImageDataUrl = await QRCode.toDataURL(payload, {
      width: 400,
      margin: 2,
      color: { dark: '#1e3a5f', light: '#ffffff' },
    });
    return { payload, qrImageDataUrl, companyName: company.name };
  }

  async getBranchQrData(companyId: string, branchId: string, scope?: BranchScope) {
    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, companyId },
    });
    if (!branch) throw new NotFoundException('Şube bulunamadı');
    if (!canAccessBranch(scope, branch.id)) {
      throw new NotFoundException('Şube bulunamadı');
    }

    let secret = branch.qrSecret;
    if (!secret) {
      secret = randomBytes(32).toString('hex');
      await this.prisma.branch.update({ where: { id: branch.id }, data: { qrSecret: secret } });
    }

    const windowIndex = currentQrWindow();
    const token = generateBranchQrToken(secret, windowIndex);
    const payload = JSON.stringify({
      type: 'branch',
      companyId,
      branchId: branch.id,
      token,
    });
    const qrImageDataUrl = await QRCode.toDataURL(payload, {
      width: 400,
      margin: 2,
      color: { dark: '#1e3a5f', light: '#ffffff' },
    });

    const nowMs = Date.now();
    const windowEndMs = (windowIndex + 1) * QR_ROTATION_WINDOW_SECONDS * 1000;
    const secondsUntilRefresh = Math.max(1, Math.ceil((windowEndMs - nowMs) / 1000));

    return {
      payload,
      qrImageDataUrl,
      branchName: branch.name,
      rotationSeconds: QR_ROTATION_WINDOW_SECONDS,
      secondsUntilRefresh,
    };
  }

  async createDepartment(companyId: string, name: string) {
    return this.prisma.department.create({ data: { companyId, name } });
  }

  async listDepartments(companyId: string) {
    return this.prisma.department.findMany({
      where: { companyId },
      include: { _count: { select: { employees: true } } },
    });
  }
}
