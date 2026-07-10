import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CompaniesService } from '../companies/companies.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { CreateResellerInput, CreateResellerCustomerInput } from '@qr/shared';
import { UserRole } from '@prisma/client';
import { createUniquePublicId } from '../common/utils/public-id';

@Injectable()
export class ResellersService {
  constructor(
    private prisma: PrismaService,
    private companies: CompaniesService,
    private analytics: AnalyticsService,
  ) {}

  async getDashboard(resellerId: string) {
    const reseller = await this.prisma.reseller.findUnique({
      where: { id: resellerId },
      include: {
        companies: {
          include: {
            _count: { select: { employees: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!reseller) throw new NotFoundException('Bayi bulunamadı');

    const settings = await this.getPlatformSettings();
    const portfolioAnalytics = await this.analytics.getResellerAnalytics(resellerId);
    const companies = reseller.companies.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      employeeCount: c._count.employees,
      monthlyFee: Number(c.monthlySubscriptionFee),
      commission: Number(c.monthlySubscriptionFee) * reseller.commissionRate,
      createdAt: c.createdAt,
    }));

    return {
      reseller: {
        id: reseller.id,
        companyName: reseller.companyName,
        code: reseller.code,
        commissionRate: reseller.commissionRate,
        iyzicoOnboardingStatus: reseller.iyzicoOnboardingStatus,
        phone: reseller.phone,
      },
      platform: settings,
      stats: {
        ...portfolioAnalytics,
      },
      companies,
    };
  }

  async getCompanyDetail(resellerId: string, companyId: string) {
    const company = await this.prisma.company.findFirst({
      where: { id: companyId, resellerId },
      include: {
        branches: true,
        employees: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true, isActive: true, publicId: true } },
            manager: { include: { user: { select: { firstName: true, lastName: true, publicId: true } } } },
          },
        },
        _count: { select: { employees: true, attendanceRecords: true } },
      },
    });
    if (!company) throw new NotFoundException('Müşteri bulunamadı');
    const performance = await this.analytics.getCompanyAnalytics(companyId);
    return { ...company, performance };
  }

  async getCompanyQr(resellerId: string, companyId: string) {
    const company = await this.prisma.company.findFirst({
      where: { id: companyId, resellerId },
    });
    if (!company) throw new NotFoundException('Müşteri bulunamadı');
    return this.companies.getQrData(companyId);
  }

  async getCompanyPerformance(resellerId: string, companyId: string) {
    const data = await this.analytics.getCompanyAnalyticsForReseller(resellerId, companyId);
    if (!data) throw new NotFoundException('Müşteri bulunamadı');
    return data;
  }

  async createCustomer(resellerId: string, dto: CreateResellerCustomerInput) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Bu e-posta zaten kayıtlı');

    const settings = await this.getPlatformSettings();
    const planId = dto.planId ?? settings.defaultPlanId;
    const slug = dto.companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const publicId = await createUniquePublicId(this.prisma);

    const company = await this.prisma.company.create({
      data: {
        name: dto.companyName,
        slug: `${slug}-${Date.now()}`,
        resellerId,
        monthlySubscriptionFee: settings.monthlySubscriptionFee,
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
          create: {
            name: 'Merkez',
            latitude: 41.0082,
            longitude: 28.9784,
            geofenceRadiusM: 300,
          },
        },
        ...(planId
          ? {
              subscription: {
                create: { planId, status: 'TRIAL' },
              },
            }
          : {}),
      },
      include: { users: true, branches: true },
    });

    return {
      company: { id: company.id, name: company.name, qrToken: company.qrToken },
      admin: company.users[0],
      message: 'Müşteri oluşturuldu. QR kodu detay sayfasından indirilebilir.',
    };
  }

  async getPlatformSettings() {
    let settings = await this.prisma.platformSettings.findUnique({ where: { id: 'default' } });
    if (!settings) {
      settings = await this.prisma.platformSettings.create({ data: { id: 'default' } });
    }
    return settings;
  }

  async createReseller(dto: CreateResellerInput) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Bu e-posta zaten kayıtlı');

    const codeExists = await this.prisma.reseller.findUnique({ where: { code: dto.code.toUpperCase() } });
    if (codeExists) throw new ConflictException('Bu bayi kodu kullanılıyor');

    const settings = await this.getPlatformSettings();
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
        commissionRate: dto.commissionRate ?? settings.defaultCommissionRate,
        phone: dto.phone,
      },
    });

    return { user, reseller };
  }

  async listAll() {
    return this.prisma.reseller.findMany({
      include: {
        user: { select: { email: true, firstName: true, lastName: true, isActive: true, publicId: true } },
        _count: { select: { companies: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateCommission(resellerId: string, commissionRate: number) {
    return this.prisma.reseller.update({
      where: { id: resellerId },
      data: { commissionRate },
    });
  }

  async findByCode(code: string) {
    return this.prisma.reseller.findFirst({
      where: { code: code.toUpperCase(), isActive: true },
    });
  }
}
