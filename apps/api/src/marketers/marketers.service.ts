import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CompaniesService } from '../companies/companies.service';
import { AnalyticsService } from '../analytics/analytics.service';
import {
  CreateMarketerInput,
  CreateMarketerResellerInput,
  CreateMarketerCustomerInput,
  UpdateMarketerInput,
  CreateResellerInput,
} from '@qr/shared';
import { UserRole } from '@prisma/client';
import { createUniquePublicId } from '../common/utils/public-id';
import { calculateCommissionSplit } from '@qr/shared';

@Injectable()
export class MarketersService {
  constructor(
    private prisma: PrismaService,
    private companies: CompaniesService,
    private analytics: AnalyticsService,
  ) {}

  async getDashboard(marketerId: string) {
    const marketer = await this.prisma.marketer.findUnique({
      where: { id: marketerId },
      include: {
        resellers: {
          include: { _count: { select: { companies: true } } },
          orderBy: { createdAt: 'desc' },
        },
        companies: {
          include: { _count: { select: { employees: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!marketer) throw new NotFoundException('Pazarlamacı bulunamadı');

    const analytics = await this.analytics.getMarketerAnalytics(marketerId);
    const resellerCompanies = await this.prisma.company.count({
      where: { reseller: { marketerId } },
    });

    return {
      marketer: {
        id: marketer.id,
        companyName: marketer.companyName,
        code: marketer.code,
        commissionRate: marketer.commissionRate,
        phone: marketer.phone,
      },
      stats: {
        ...analytics,
        totalResellers: marketer.resellers.length,
        directCompanies: marketer.companies.length,
        resellerCompanies,
      },
      resellers: marketer.resellers.map((r) => ({
        id: r.id,
        companyName: r.companyName,
        code: r.code,
        commissionRate: r.commissionRate,
        clientCount: r._count.companies,
      })),
      directCompanies: marketer.companies.map((c) => ({
        id: c.id,
        name: c.name,
        employeeCount: c._count.employees,
      })),
    };
  }

  async getPayments(marketerId: string) {
    const payments = await this.prisma.paymentTransaction.findMany({
      where: { marketerId, status: 'SUCCESS' },
      include: {
        company: { select: { name: true } },
        reseller: { select: { companyName: true, code: true } },
        plan: { select: { name: true } },
      },
      orderBy: { paidAt: 'desc' },
    });
    const totalCommission = payments.reduce((s, p) => s + p.marketerAmount, 0);
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const monthlyCommission = payments
      .filter((p) => (p.paidAt || p.createdAt) >= startOfMonth)
      .reduce((s, p) => s + p.marketerAmount, 0);
    return { totalCommission, monthlyCommission, payments };
  }

  async listResellers(marketerId: string) {
    return this.prisma.reseller.findMany({
      where: { marketerId },
      include: {
        user: { select: { email: true, firstName: true, lastName: true, publicId: true, isActive: true } },
        _count: { select: { companies: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createReseller(marketerId: string, dto: CreateMarketerResellerInput) {
    return this.createResellerInternal({ ...dto, marketerId });
  }

  async createResellerInternal(dto: CreateResellerInput & { marketerId?: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Bu e-posta zaten kayıtlı');
    const codeExists = await this.prisma.reseller.findUnique({ where: { code: dto.code.toUpperCase() } });
    if (codeExists) throw new ConflictException('Bu bayi kodu kullanılıyor');

    const settings = await this.prisma.platformSettings.findUnique({ where: { id: 'default' } });
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const publicId = await createUniquePublicId(this.prisma);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: UserRole.RESELLER,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        publicId,
        isActive: true,
      },
    });

    const reseller = await this.prisma.reseller.create({
      data: {
        userId: user.id,
        marketerId: dto.marketerId,
        companyName: dto.companyName,
        code: dto.code.toUpperCase(),
        commissionRate: dto.commissionRate ?? settings?.defaultCommissionRate ?? 0.15,
        phone: dto.phone,
      },
    });
    return { user, reseller };
  }

  async createCustomer(marketerId: string, dto: CreateMarketerCustomerInput) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Bu e-posta zaten kayıtlı');

    const settings = await this.prisma.platformSettings.findUnique({ where: { id: 'default' } });
    const planId = dto.planId ?? settings?.defaultPlanId;
    const slug = dto.companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const publicId = await createUniquePublicId(this.prisma);

    const company = await this.prisma.company.create({
      data: {
        name: dto.companyName,
        slug: `${slug}-${Date.now()}`,
        marketerId,
        monthlySubscriptionFee: settings?.monthlySubscriptionFee ?? 299,
        users: {
          create: {
            email: dto.email,
            passwordHash,
            role: UserRole.COMPANY_ADMIN,
            firstName: dto.firstName,
            lastName: dto.lastName,
            phone: dto.phone,
            publicId,
            isActive: true,
          },
        },
        branches: {
          create: { name: 'Merkez', latitude: 41.0082, longitude: 28.9784, geofenceRadiusM: 300 },
        },
        ...(planId ? { subscription: { create: { planId, status: 'TRIAL' } } } : {}),
      },
      include: { users: true },
    });
    return {
      company: { id: company.id, name: company.name, qrToken: company.qrToken },
      admin: company.users[0],
      message: 'Doğrudan müşteri oluşturuldu.',
    };
  }

  async getCompanyDetail(marketerId: string, companyId: string) {
    const company = await this.prisma.company.findFirst({
      where: {
        id: companyId,
        OR: [{ marketerId }, { reseller: { marketerId } }],
      },
      include: {
        branches: true,
        reseller: { select: { companyName: true, code: true } },
        employees: {
          include: { user: { select: { firstName: true, lastName: true, email: true, publicId: true, isActive: true } } },
        },
        _count: { select: { employees: true } },
      },
    });
    if (!company) throw new NotFoundException('Müşteri bulunamadı');
    const performance = await this.analytics.getCompanyAnalytics(companyId);
    return { ...company, performance };
  }

  async getCompanyQr(marketerId: string, companyId: string) {
    const company = await this.prisma.company.findFirst({
      where: { id: companyId, OR: [{ marketerId }, { reseller: { marketerId } }] },
    });
    if (!company) throw new NotFoundException('Müşteri bulunamadı');
    return this.companies.getQrData(companyId);
  }

  async createMarketer(dto: CreateMarketerInput) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Bu e-posta zaten kayıtlı');
    const codeExists = await this.prisma.marketer.findUnique({ where: { code: dto.code.toUpperCase() } });
    if (codeExists) throw new ConflictException('Bu pazarlamacı kodu kullanılıyor');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const publicId = await createUniquePublicId(this.prisma);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: UserRole.MARKETER,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        publicId,
        isActive: true,
      },
    });
    const marketer = await this.prisma.marketer.create({
      data: {
        userId: user.id,
        companyName: dto.companyName,
        code: dto.code.toUpperCase(),
        commissionRate: dto.commissionRate ?? 0.2,
        phone: dto.phone,
      },
    });
    return { user, marketer };
  }

  async listAll() {
    return this.prisma.marketer.findMany({
      include: {
        user: { select: { email: true, firstName: true, lastName: true, publicId: true, isActive: true } },
        _count: { select: { resellers: true, companies: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string) {
    const marketer = await this.prisma.marketer.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, firstName: true, lastName: true, publicId: true, isActive: true, phone: true } },
        resellers: { include: { _count: { select: { companies: true } } } },
        companies: { include: { _count: { select: { employees: true } } } },
      },
    });
    if (!marketer) throw new NotFoundException('Pazarlamacı bulunamadı');
    return marketer;
  }

  async update(id: string, dto: UpdateMarketerInput) {
    const marketer = await this.prisma.marketer.findUnique({ where: { id } });
    if (!marketer) throw new NotFoundException('Pazarlamacı bulunamadı');
    return this.prisma.marketer.update({ where: { id }, data: dto });
  }

  async findByCode(code: string) {
    return this.prisma.marketer.findFirst({
      where: { code: code.toUpperCase(), isActive: true },
    });
  }

  estimateCommission(monthlyFee: number, resellerRate: number, marketerRate: number, hasReseller: boolean, hasMarketer: boolean) {
    return calculateCommissionSplit({
      gross: monthlyFee,
      hasReseller,
      resellerRate,
      hasMarketer,
      marketerRate,
    });
  }
}
