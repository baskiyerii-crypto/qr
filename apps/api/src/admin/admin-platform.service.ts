import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { UserRole, PaymentStatus } from '@prisma/client';
import { createUniquePublicId } from '../common/utils/public-id';

function maskSecret(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.length <= 4) return '****';
  return '****' + value.slice(-4);
}

@Injectable()
export class AdminPlatformService {
  constructor(
    private prisma: PrismaService,
    private whatsapp: WhatsappService,
  ) {}

  async getOverview() {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      totalCompanies,
      totalResellers,
      totalEmployees,
      pendingApplications,
      monthlyRevenue,
      activeSubscriptions,
      recentPayments,
      recentApplications,
      whatsappStatus,
    ] = await Promise.all([
      this.prisma.company.count(),
      this.prisma.reseller.count({ where: { isActive: true } }),
      this.prisma.employee.count({ where: { isActive: true } }),
      this.prisma.resellerApplication.count({
        where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } },
      }),
      this.prisma.paymentTransaction.aggregate({
        where: { status: PaymentStatus.SUCCESS, paidAt: { gte: startOfMonth } },
        _sum: { platformAmount: true },
      }),
      this.prisma.companySubscription.count({ where: { status: 'ACTIVE' } }),
      this.prisma.paymentTransaction.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          company: { select: { name: true } },
          reseller: { select: { companyName: true, code: true } },
          plan: { select: { name: true } },
        },
      }),
      this.prisma.resellerApplication.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          status: true,
          createdAt: true,
        },
      }),
      this.whatsapp.getConnectionStatus(),
    ]);

    return {
      stats: {
        totalCompanies,
        totalResellers,
        totalEmployees,
        pendingApplications,
        monthlyPlatformRevenue: monthlyRevenue._sum?.platformAmount ?? 0,
        activeSubscriptions,
        whatsappState: whatsappStatus.state,
      },
      recentPayments,
      recentApplications,
    };
  }

  async listCompanies() {
    return this.prisma.company.findMany({
      include: {
        reseller: { select: { id: true, companyName: true, code: true } },
        marketer: { select: { id: true, companyName: true, code: true } },
        subscription: { include: { plan: { select: { name: true } } } },
        _count: { select: { employees: true, branches: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCompany(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        reseller: { include: { marketer: { select: { id: true, companyName: true, code: true } } } },
        marketer: true,
        subscription: { include: { plan: true } },
        branches: { select: { id: true, name: true } },
        _count: { select: { employees: true, branches: true } },
        payments: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { plan: { select: { name: true } } },
        },
      },
    });
    if (!company) throw new NotFoundException('Şirket bulunamadı');
    return company;
  }

  async updateCompany(
    id: string,
    data: { resellerId?: string | null; marketerId?: string | null; monthlySubscriptionFee?: number },
  ) {
    await this.getCompany(id);
    return this.prisma.company.update({
      where: { id },
      data: {
        resellerId: data.resellerId,
        marketerId: data.marketerId,
        monthlySubscriptionFee: data.monthlySubscriptionFee,
      },
    });
  }

  async getReseller(id: string) {
    const reseller = await this.prisma.reseller.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, firstName: true, lastName: true, isActive: true } },
        marketer: { select: { id: true, companyName: true, code: true } },
        assignedPlan: { select: { id: true, name: true } },
        companies: {
          include: { _count: { select: { employees: true } } },
          orderBy: { createdAt: 'desc' },
        },
        payments: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: { company: { select: { name: true } }, plan: { select: { name: true } } },
        },
        _count: { select: { companies: true } },
      },
    });
    if (!reseller) throw new NotFoundException('Bayi bulunamadı');
    return reseller;
  }

  async updateReseller(
    id: string,
    data: {
      commissionRate?: number;
      marketerId?: string | null;
      isActive?: boolean;
      assignedPlanId?: string | null;
      iban?: string;
      taxNumber?: string;
    },
  ) {
    await this.getReseller(id);
    const reseller = await this.prisma.reseller.update({
      where: { id },
      data,
    });
    if (data.isActive !== undefined) {
      const r = await this.prisma.reseller.findUnique({ where: { id }, select: { userId: true } });
      if (r) {
        await this.prisma.user.update({ where: { id: r.userId }, data: { isActive: data.isActive } });
      }
    }
    return reseller;
  }

  async listSubscriptions() {
    return this.prisma.companySubscription.findMany({
      include: {
        company: { select: { id: true, name: true } },
        plan: { select: { name: true, monthlyPrice: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async updateSubscription(id: string, data: { status?: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' }) {
    const sub = await this.prisma.companySubscription.findUnique({ where: { id } });
    if (!sub) throw new NotFoundException('Abonelik bulunamadı');
    return this.prisma.companySubscription.update({ where: { id }, data });
  }

  async listPayments(filters?: { status?: string; resellerId?: string; companyId?: string }) {
    const statusFilter = filters?.status as PaymentStatus | undefined;
    return this.prisma.paymentTransaction.findMany({
      where: {
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(filters?.resellerId ? { resellerId: filters.resellerId } : {}),
        ...(filters?.companyId ? { companyId: filters.companyId } : {}),
      },
      include: {
        company: { select: { name: true } },
        reseller: { select: { companyName: true, code: true } },
        plan: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async getCommissionSummary() {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const payments = await this.prisma.paymentTransaction.findMany({
      where: { status: PaymentStatus.SUCCESS, paidAt: { gte: startOfMonth } },
      select: { resellerId: true, marketerId: true, platformAmount: true, resellerAmount: true, marketerAmount: true, amount: true },
    });

    const totals = payments.reduce(
      (acc, p) => {
        acc.platform += p.platformAmount;
        acc.reseller += p.resellerAmount;
        acc.marketer += p.marketerAmount;
        acc.gross += p.amount;
        return acc;
      },
      { platform: 0, reseller: 0, marketer: 0, gross: 0 },
    );

    const byReseller = await this.prisma.reseller.findMany({
      include: {
        user: { select: { email: true } },
        marketer: { select: { companyName: true, code: true } },
        _count: { select: { companies: true } },
        payments: {
          where: { status: PaymentStatus.SUCCESS, paidAt: { gte: startOfMonth } },
          select: { resellerAmount: true },
        },
      },
      orderBy: { companyName: 'asc' },
    });

    const byMarketer = await this.prisma.marketer.findMany({
      include: {
        user: { select: { email: true } },
        _count: { select: { resellers: true, companies: true } },
        payments: {
          where: { status: PaymentStatus.SUCCESS, paidAt: { gte: startOfMonth } },
          select: { marketerAmount: true },
        },
      },
      orderBy: { companyName: 'asc' },
    });

    return {
      monthTotals: totals,
      resellers: byReseller.map((r) => ({
        id: r.id,
        companyName: r.companyName,
        code: r.code,
        commissionRate: r.commissionRate,
        marketerName: r.marketer?.companyName ?? null,
        clientCount: r._count.companies,
        monthlyCommission: r.payments.reduce((s, p) => s + p.resellerAmount, 0),
        isActive: r.isActive,
      })),
      marketers: byMarketer.map((m) => ({
        id: m.id,
        companyName: m.companyName,
        code: m.code,
        commissionRate: m.commissionRate,
        resellerCount: m._count.resellers,
        directClientCount: m._count.companies,
        monthlyCommission: m.payments.reduce((s, p) => s + p.marketerAmount, 0),
        isActive: m.isActive,
      })),
    };
  }

  async getSettings() {
    let settings = await this.prisma.platformSettings.findUnique({ where: { id: 'default' } });
    if (!settings) {
      settings = await this.prisma.platformSettings.create({ data: { id: 'default' } });
    }
    const plans = await this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { sortOrder: 'asc' },
    });
    return { settings, plans };
  }

  async updateSettings(data: {
    defaultCommissionRate?: number;
    monthlySubscriptionFee?: number;
    defaultPlanId?: string | null;
    webAppUrl?: string;
    requireEmployeeLocation?: boolean;
    brandTitle?: string | null;
    brandAddress?: string | null;
    brandIconUrl?: string | null;
    brandSubtitleCompany?: string | null;
    brandSubtitleAdmin?: string | null;
    brandSubtitleReseller?: string | null;
    brandSubtitleMarketer?: string | null;
  }) {
    return this.prisma.platformSettings.upsert({
      where: { id: 'default' },
      create: { id: 'default', ...data },
      update: data,
    });
  }

  async getIntegrations() {
    const s = await this.prisma.platformSettings.findUnique({ where: { id: 'default' } });
    return {
      evolutionApiUrl: s?.evolutionApiUrl ?? null,
      evolutionApiKey: maskSecret(s?.evolutionApiKey),
      evolutionInstance: s?.evolutionInstance ?? null,
      iyzicoApiKey: maskSecret(s?.iyzicoApiKey),
      iyzicoSecretKey: maskSecret(s?.iyzicoSecretKey),
      iyzicoBaseUrl: s?.iyzicoBaseUrl ?? null,
      webAppUrl: s?.webAppUrl ?? null,
    };
  }

  async updateIntegrations(data: {
    evolutionApiUrl?: string;
    evolutionApiKey?: string;
    evolutionInstance?: string;
    iyzicoApiKey?: string;
    iyzicoSecretKey?: string;
    iyzicoBaseUrl?: string;
    webAppUrl?: string;
  }) {
    const update: Record<string, string> = {};
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined && v !== '' && !v.startsWith('****')) {
        update[k] = v;
      }
    }
    return this.prisma.platformSettings.upsert({
      where: { id: 'default' },
      create: { id: 'default', ...update },
      update,
    });
  }

  async listSuperAdmins() {
    return this.prisma.user.findMany({
      where: { role: UserRole.SUPER_ADMIN },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createSuperAdmin(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ConflictException('Bu e-posta zaten kayıtlı');
    const passwordHash = await bcrypt.hash(data.password, 12);
    const publicId = await createUniquePublicId(this.prisma);
    return this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: UserRole.SUPER_ADMIN,
        publicId,
        isActive: true,
      },
      select: { id: true, publicId: true, email: true, firstName: true, lastName: true, isActive: true, createdAt: true },
    });
  }

  async updateSuperAdmin(id: string, data: { isActive?: boolean }) {
    const user = await this.prisma.user.findFirst({
      where: { id, role: UserRole.SUPER_ADMIN },
    });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı');
    return this.prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, firstName: true, lastName: true, isActive: true, createdAt: true },
    });
  }

  async getActivityLog() {
    return this.prisma.resellerApplicationEvent.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
      include: {
        application: {
          select: { firstName: true, lastName: true, email: true, companyName: true },
        },
      },
    });
  }
}
