import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { IyzicoService } from './iyzico.service';
import { SubscriptionPlanInput } from '@qr/shared';
import { resolveCommissionForCompany } from '../common/utils/commission';

@Injectable()
export class BillingService {
  constructor(
    private prisma: PrismaService,
    private iyzico: IyzicoService,
    private config: ConfigService,
  ) {}

  async listPlans() {
    return this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async listAllPlans() {
    return this.prisma.subscriptionPlan.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  async createPlan(dto: SubscriptionPlanInput) {
    return this.prisma.subscriptionPlan.create({ data: dto });
  }

  async updatePlan(id: string, dto: Partial<import('@qr/shared').SubscriptionPlanInput>) {
    return this.prisma.subscriptionPlan.update({ where: { id }, data: dto });
  }

  async getPayoutConfig() {
    let cfg = await this.prisma.commissionPayoutConfig.findUnique({ where: { id: 'default' } });
    if (!cfg) {
      cfg = await this.prisma.commissionPayoutConfig.create({ data: { id: 'default' } });
    }
    return cfg;
  }

  async updatePayoutConfig(data: {
    payoutFrequency?: 'INSTANT' | 'WEEKLY' | 'MONTHLY';
    minimumPayoutAmount?: number;
    holdDays?: number;
  }) {
    return this.prisma.commissionPayoutConfig.upsert({
      where: { id: 'default' },
      create: { id: 'default', ...data },
      update: data,
    });
  }

  async startCheckout(companyId: string, planId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        users: { where: { role: 'COMPANY_ADMIN' }, take: 1 },
        reseller: true,
        marketer: true,
      },
    });
    if (!company) throw new NotFoundException('Şirket bulunamadı');

    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan || !plan.isActive) throw new NotFoundException('Plan bulunamadı');

    const admin = company.users[0];
    if (!admin) throw new BadRequestException('Şirket yöneticisi bulunamadı');

    const callbackUrl =
      this.config.get('IYZICO_CALLBACK_URL') ||
      `http://localhost:3001/api/billing/iyzico/callback`;

    const resellerShare = company.reseller ? company.reseller.commissionRate : 0;
    const checkout = await this.iyzico.initializeCheckout({
      companyId,
      planId,
      buyer: {
        id: admin.id,
        name: admin.firstName,
        surname: admin.lastName,
        email: admin.email,
        gsmNumber: admin.phone || undefined,
      },
      price: plan.monthlyPrice,
      resellerSubMerchantKey: company.reseller?.iyzicoSubMerchantKey || undefined,
      resellerShare,
      platformShare: 1 - resellerShare,
      callbackUrl,
    });

    await this.prisma.companySubscription.upsert({
      where: { companyId },
      create: {
        companyId,
        planId,
        status: 'TRIAL',
        iyzicoSubscriptionRef: checkout.token,
      },
      update: {
        planId,
        iyzicoSubscriptionRef: checkout.token,
      },
    });

    return checkout;
  }

  async handleCallback(token: string) {
    const result = await this.iyzico.retrieveCheckoutResult(token);
    if (result.status !== 'success' || result.paymentStatus !== 'SUCCESS') {
      return { ok: false, message: result.errorMessage || 'Ödeme başarısız' };
    }

    const subscription = await this.prisma.companySubscription.findFirst({
      where: { iyzicoSubscriptionRef: token },
      include: {
        company: {
          include: {
            reseller: { include: { marketer: true } },
            marketer: true,
          },
        },
        plan: true,
      },
    });
    if (!subscription) return { ok: false, message: 'Abonelik bulunamadı' };

    const amount = parseFloat(result.paidPrice || '0');
    const split = resolveCommissionForCompany(subscription.company, amount);

    await this.prisma.$transaction([
      this.prisma.companySubscription.update({
        where: { id: subscription.id },
        data: {
          status: 'ACTIVE',
          lastPaymentAt: new Date(),
          nextBillingAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          iyzicoCustomerRef: result.paymentId,
        },
      }),
      this.prisma.paymentTransaction.create({
        data: {
          companyId: subscription.companyId,
          resellerId: split.resellerId,
          marketerId: split.marketerId,
          planId: subscription.planId,
          amount,
          platformAmount: split.platformAmount,
          resellerAmount: split.resellerAmount,
          marketerAmount: split.marketerAmount,
          iyzicoPaymentId: result.paymentId,
          status: 'SUCCESS',
          paidAt: new Date(),
        },
      }),
      this.prisma.company.update({
        where: { id: subscription.companyId },
        data: { monthlySubscriptionFee: amount },
      }),
    ]);

    return { ok: true, message: 'Ödeme kaydedildi' };
  }

  async getCompanySubscription(companyId: string) {
    return this.prisma.companySubscription.findUnique({
      where: { companyId },
      include: { plan: true },
    });
  }

  async getResellerPayments(resellerId: string) {
    const payments = await this.prisma.paymentTransaction.findMany({
      where: { resellerId, status: 'SUCCESS' },
      include: {
        company: { select: { name: true } },
        plan: { select: { name: true } },
      },
      orderBy: { paidAt: 'desc' },
    });

    const totalCommission = payments.reduce((s, p) => s + p.resellerAmount, 0);
    const thisMonth = payments.filter((p) => {
      const d = p.paidAt || p.createdAt;
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const monthlyCommission = thisMonth.reduce((s, p) => s + p.resellerAmount, 0);

    return { payments, totalCommission, monthlyCommission };
  }

  async getPaymentRedirectUrl(success: boolean) {
    const settings = await this.prisma.platformSettings.findUnique({ where: { id: 'default' } });
    const webUrl = settings?.webAppUrl || 'http://localhost:5173';
    return `${webUrl}/billing?${success ? 'success=1' : 'error=1'}`;
  }
}
