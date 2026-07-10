import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { Reseller } from '@prisma/client';

@Injectable()
export class IyzicoService {
  private readonly logger = new Logger(IyzicoService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  private async getCredentials() {
    const settings = await this.prisma.platformSettings.findUnique({ where: { id: 'default' } });
    return {
      apiKey: settings?.iyzicoApiKey || this.config.get('IYZICO_API_KEY') || '',
      secretKey: settings?.iyzicoSecretKey || this.config.get('IYZICO_SECRET_KEY') || '',
      baseUrl: settings?.iyzicoBaseUrl || this.config.get('IYZICO_BASE_URL') || 'https://sandbox-api.iyzipay.com',
    };
  }

  private generateAuthorizationHeader(
    apiKey: string,
    secretKey: string,
    uri: string,
    body: string,
  ): string {
    const randomKey = Date.now().toString() + Math.random().toString(36).slice(2);
    const payload = randomKey + uri + body;
    const signature = createHmac('sha256', secretKey).update(payload).digest('hex');
    const authString = `apiKey:${apiKey}&randomKey:${randomKey}&signature:${signature}`;
    return `IYZWSv2 ${Buffer.from(authString).toString('base64')}`;
  }

  private async request<T>(uri: string, body: Record<string, unknown>): Promise<T> {
    const { apiKey, secretKey, baseUrl } = await this.getCredentials();
    if (!apiKey || !secretKey) {
      throw new Error('iyzico yapılandırılmamış');
    }
    const bodyStr = JSON.stringify(body);
    const res = await fetch(`${baseUrl}${uri}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.generateAuthorizationHeader(apiKey, secretKey, uri, bodyStr),
      },
      body: bodyStr,
    });
    return res.json() as Promise<T>;
  }

  async registerSubMerchant(reseller: Reseller & { user?: { firstName: string; lastName: string; email: string } }) {
    if (!reseller.iban) {
      return { ok: false, message: 'IBAN girilmedi — iyzico kaydı atlandı' };
    }

    try {
      const result = await this.request<{
        status: string;
        subMerchantKey?: string;
        errorMessage?: string;
      }>('/v2/sub-merchant/create', {
        locale: 'tr',
        conversationId: reseller.id,
        subMerchantExternalId: reseller.id,
        subMerchantType: 'PERSONAL',
        address: 'Türkiye',
        contactName: reseller.companyName,
        contactSurname: reseller.companyName,
        email: reseller.user?.email || `reseller-${reseller.id}@qr.local`,
        gsmNumber: reseller.phone || '+905000000000',
        name: reseller.companyName,
        iban: reseller.iban,
        currency: 'TRY',
      });

      if (result.status === 'success' && result.subMerchantKey) {
        await this.prisma.reseller.update({
          where: { id: reseller.id },
          data: {
            iyzicoSubMerchantKey: result.subMerchantKey,
            iyzicoOnboardingStatus: 'REGISTERED',
          },
        });
        return { ok: true, message: 'iyzico alt üye kaydı tamamlandı' };
      }

      await this.prisma.reseller.update({
        where: { id: reseller.id },
        data: { iyzicoOnboardingStatus: 'FAILED' },
      });
      return { ok: false, message: result.errorMessage || 'iyzico kayıt başarısız' };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'iyzico hatası';
      this.logger.warn(msg);
      await this.prisma.reseller.update({
        where: { id: reseller.id },
        data: { iyzicoOnboardingStatus: 'PENDING' },
      });
      return { ok: false, message: msg };
    }
  }

  async initializeCheckout(params: {
    companyId: string;
    planId: string;
    buyer: { id: string; name: string; surname: string; email: string; gsmNumber?: string };
    price: number;
    resellerSubMerchantKey?: string;
    resellerShare: number;
    platformShare: number;
    callbackUrl: string;
  }) {
    const basketId = `BASKET-${params.companyId}-${Date.now()}`;
    const paymentItems: Record<string, unknown>[] = [
      {
        id: params.planId,
        name: 'QR Personel Abonelik',
        category1: 'SaaS',
        itemType: 'VIRTUAL',
        price: params.price.toFixed(2),
        subMerchantKey: params.resellerSubMerchantKey,
        subMerchantPrice: params.resellerSubMerchantKey
          ? (params.price * params.resellerShare).toFixed(2)
          : undefined,
      },
    ];

    const body: Record<string, unknown> = {
      locale: 'tr',
      conversationId: params.companyId,
      price: params.price.toFixed(2),
      paidPrice: params.price.toFixed(2),
      currency: 'TRY',
      basketId,
      paymentGroup: 'SUBSCRIPTION',
      callbackUrl: params.callbackUrl,
      enabledInstallments: [1],
      buyer: {
        id: params.buyer.id,
        name: params.buyer.name,
        surname: params.buyer.surname,
        gsmNumber: params.buyer.gsmNumber || '+905000000000',
        email: params.buyer.email,
        identityNumber: '11111111111',
        registrationAddress: 'Türkiye',
        ip: '85.34.78.112',
        city: 'Istanbul',
        country: 'Turkey',
      },
      shippingAddress: { contactName: params.buyer.name, city: 'Istanbul', country: 'Turkey', address: 'Türkiye' },
      billingAddress: { contactName: params.buyer.name, city: 'Istanbul', country: 'Turkey', address: 'Türkiye' },
      basketItems: paymentItems,
    };

    const result = await this.request<{
      status: string;
      checkoutFormContent?: string;
      token?: string;
      paymentPageUrl?: string;
      errorMessage?: string;
    }>('/payment/iyzipos/checkoutform/initialize/auth/ecom', body);

    if (result.status !== 'success') {
      throw new Error(result.errorMessage || 'Ödeme başlatılamadı');
    }

    return {
      token: result.token,
      paymentPageUrl: result.paymentPageUrl,
      checkoutFormContent: result.checkoutFormContent,
    };
  }

  async retrieveCheckoutResult(token: string) {
    return this.request<{
      status: string;
      paymentStatus?: string;
      paymentId?: string;
      paidPrice?: string;
      errorMessage?: string;
    }>('/payment/iyzipos/checkoutform/auth/ecom/detail', {
      locale: 'tr',
      token,
    });
  }
}
