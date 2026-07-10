import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  private async getConfig() {
    const settings = await this.prisma.platformSettings.findUnique({ where: { id: 'default' } });
    return {
      url: settings?.evolutionApiUrl || this.config.get('EVOLUTION_API_URL') || '',
      apiKey: settings?.evolutionApiKey || this.config.get('EVOLUTION_API_KEY') || '',
      instance: settings?.evolutionInstance || this.config.get('EVOLUTION_INSTANCE_NAME') || '',
    };
  }

  private async evolutionFetch<T = unknown>(path: string): Promise<{ ok: boolean; data?: T; error?: string }> {
    const { url, apiKey, instance } = await this.getConfig();
    if (!url || !instance) {
      return { ok: false, error: 'WhatsApp yapılandırılmamış' };
    }
    try {
      const endpoint = `${url.replace(/\/$/, '')}${path}`;
      const res = await fetch(endpoint, {
        headers: { ...(apiKey ? { apikey: apiKey } : {}) },
        signal: AbortSignal.timeout(15000),
      });
      const text = await res.text();
      let data: T | undefined;
      try {
        data = JSON.parse(text) as T;
      } catch {
        data = text as T;
      }
      if (!res.ok) {
        return { ok: false, error: typeof data === 'object' && data && 'message' in (data as object)
          ? String((data as { message?: string }).message)
          : text };
      }
      return { ok: true, data };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Bilinmeyen hata';
      return { ok: false, error: msg };
    }
  }

  async getConnectionStatus(): Promise<{
    configured: boolean;
    instance?: string;
    state: 'open' | 'connecting' | 'close' | 'unknown' | 'unconfigured';
    message?: string;
  }> {
    const { url, instance } = await this.getConfig();
    if (!url || !instance) {
      return { configured: false, state: 'unconfigured', message: 'Evolution API ayarlanmamış' };
    }

    const result = await this.evolutionFetch<{ instance?: { state?: string }; state?: string }>(
      `/instance/connectionState/${instance}`,
    );

    if (!result.ok) {
      return {
        configured: true,
        instance,
        state: 'unknown',
        message: result.error || 'Evolution API yanıt vermiyor',
      };
    }

    const raw = result.data?.instance?.state || result.data?.state || 'unknown';
    const state = ['open', 'connecting', 'close'].includes(raw)
      ? (raw as 'open' | 'connecting' | 'close')
      : 'unknown';

    return { configured: true, instance, state };
  }

  async getQrCode(): Promise<{
    configured: boolean;
    instance?: string;
    connected: boolean;
    base64?: string;
    message?: string;
  }> {
    const status = await this.getConnectionStatus();
    if (!status.configured) {
      return { configured: false, connected: false, message: status.message };
    }
    if (status.state === 'open') {
      return { configured: true, instance: status.instance, connected: true, message: 'WhatsApp bağlı' };
    }

    const result = await this.evolutionFetch<{
      base64?: string;
      qrcode?: { base64?: string };
      instance?: { state?: string };
    }>(`/instance/connect/${status.instance}`);

    if (!result.ok) {
      return {
        configured: true,
        instance: status.instance,
        connected: false,
        message: result.error,
      };
    }

    const base64 = result.data?.base64 || result.data?.qrcode?.base64;
    const connected = result.data?.instance?.state === 'open';

    return {
      configured: true,
      instance: status.instance,
      connected,
      base64: base64?.startsWith('data:') ? base64 : base64 ? `data:image/png;base64,${base64}` : undefined,
      message: connected ? 'WhatsApp bağlı' : base64 ? undefined : 'QR kod alınamadı — Evolution çalışıyor mu?',
    };
  }

  normalizePhone(phone: string): string {
    let p = phone.replace(/\D/g, '');
    if (p.startsWith('0')) p = '90' + p.slice(1);
    if (!p.startsWith('90') && p.length === 10) p = '90' + p;
    return p;
  }

  async sendText(phone: string, message: string): Promise<{ ok: boolean; error?: string }> {
    const { url, apiKey, instance } = await this.getConfig();
    if (!url || !instance) {
      this.logger.warn(`WhatsApp yapılandırılmamış — mesaj atlandı: ${phone}`);
      return { ok: false, error: 'WhatsApp yapılandırılmamış' };
    }

    const normalized = this.normalizePhone(phone);
    try {
      const endpoint = `${url.replace(/\/$/, '')}/message/sendText/${instance}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { apikey: apiKey } : {}),
        },
        body: JSON.stringify({ number: normalized, text: message }),
      });
      if (!res.ok) {
        const text = await res.text();
        this.logger.error(`Evolution API hata: ${res.status} ${text}`);
        return { ok: false, error: text };
      }
      return { ok: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Bilinmeyen hata';
      this.logger.error(`WhatsApp gönderim hatası: ${msg}`);
      return { ok: false, error: msg };
    }
  }

  async sendApplicationReceived(phone: string, applicationId: string, webAppUrl: string) {
    const trackUrl = `${webAppUrl}/bayi-basvuru/durum?id=${applicationId}`;
    return this.sendText(
      phone,
      `QR Personel — Bayi başvurunuz alındı.\nBaşvuru No: ${applicationId.slice(0, 8).toUpperCase()}\nDurum takibi: ${trackUrl}\nİnceleme sürecinde sizinle iletişime geçilecektir.`,
    );
  }

  async sendApplicationApproved(
    phone: string,
    data: { email: string; password: string; code: string; loginUrl: string },
  ) {
    return this.sendText(
      phone,
      `QR Personel — Bayiliğiniz onaylandı!\n\nGiriş: ${data.loginUrl}\nE-posta: ${data.email}\nGeçici şifre: ${data.password}\nBayi kodunuz: ${data.code}\n\nİlk girişte şifrenizi değiştirmeniz istenecektir.`,
    );
  }

  async sendApplicationRejected(phone: string, reason: string) {
    return this.sendText(
      phone,
      `QR Personel — Bayi başvurunuz şu an için uygun bulunmadı.\nGerekçe: ${reason}\nSorularınız için bizimle iletişime geçebilirsiniz.`,
    );
  }
}
