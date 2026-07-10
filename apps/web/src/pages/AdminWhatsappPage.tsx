import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { RefreshCw, MessageCircle } from 'lucide-react';

type WhatsappStatus = {
  configured: boolean;
  instance?: string;
  state: 'open' | 'connecting' | 'close' | 'unknown' | 'unconfigured';
  message?: string;
};

type WhatsappQr = {
  configured: boolean;
  instance?: string;
  connected: boolean;
  base64?: string;
  message?: string;
};

const stateLabels: Record<string, string> = {
  open: 'Bağlı',
  connecting: 'Bağlanıyor',
  close: 'Bağlı değil',
  unknown: 'Bilinmiyor',
  unconfigured: 'Yapılandırılmamış',
};

const stateVariants: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  open: 'success',
  connecting: 'warning',
  close: 'error',
  unknown: 'default',
  unconfigured: 'default',
};

export function AdminWhatsappPage() {
  const { data: status, refetch: refetchStatus, isFetching: statusLoading } = useQuery({
    queryKey: ['admin-whatsapp-status'],
    queryFn: () => api.get<WhatsappStatus>('/admin/whatsapp/status'),
    refetchInterval: 10000,
  });

  const { data: qr, refetch: refetchQr, isFetching: qrLoading } = useQuery({
    queryKey: ['admin-whatsapp-qr'],
    queryFn: () => api.get<WhatsappQr>('/admin/whatsapp/qr'),
    enabled: status?.configured && status.state !== 'open',
    refetchInterval: 15000,
  });

  const refresh = () => {
    refetchStatus();
    refetchQr();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="WhatsApp (Evolution)"
        description="Sadece platform yöneticisi erişebilir. Bayi bildirimleri için Evolution sürekli çalışmalıdır."
        icon={<MessageCircle className="h-5 w-5" />}
        actions={
          <Button variant="secondary" onClick={refresh} disabled={statusLoading || qrLoading}>
            <RefreshCw className={`h-4 w-4 ${statusLoading || qrLoading ? 'animate-spin' : ''}`} /> Yenile
          </Button>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-slate-500">Durum</span>
          {status && (
            <Badge variant={stateVariants[status.state] || 'default'} dot>
              {stateLabels[status.state] || status.state}
            </Badge>
          )}
          {status?.instance && (
            <span className="text-sm text-slate-400">Instance: {status.instance}</span>
          )}
        </div>
        {status?.message && (
          <p className="mt-3 text-sm text-amber-700">{status.message}</p>
        )}
        {!status?.configured && (
          <p className="mt-3 text-sm text-slate-600">
            Evolution kurulu değilse: <code className="rounded bg-slate-100 px-1">npm run evolution:local</code>
          </p>
        )}
      </Card>

      {status?.configured && status.state !== 'open' && (
        <Card>
          <CardHeader><CardTitle>QR Kod — Bağlı Cihazlar</CardTitle></CardHeader>
          <p className="mb-4 text-sm text-slate-500">
            Telefondan WhatsApp → Bağlı Cihazlar → QR kodu tarayın.
          </p>
          <div className="flex min-h-[280px] items-center justify-center rounded-xl border border-slate-100 bg-slate-50 p-6">
            {qrLoading && !qr?.base64 && <span className="text-slate-400">QR yükleniyor…</span>}
            {qr?.connected && (
              <span className="text-4xl text-green-600">✓ Bağlı</span>
            )}
            {qr?.base64 && !qr.connected && (
              <img src={qr.base64} alt="WhatsApp QR" className="max-w-xs rounded-lg" />
            )}
            {!qrLoading && !qr?.base64 && !qr?.connected && (
              <span className="text-sm text-red-600">{qr?.message || 'QR alınamadı'}</span>
            )}
          </div>
        </Card>
      )}

      {status?.state === 'open' && (
        <Card>
          <p className="text-green-700">
            WhatsApp bağlantısı aktif. Bayi başvuru bildirimleri gönderilebilir.
          </p>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Çalışma notu</CardTitle></CardHeader>
        <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
          <li>Evolution sunucusu kapalıyken mesaj gönderilmez.</li>
          <li>Geliştirmede ayrı terminalde <code className="rounded bg-slate-100 px-1">npm run evolution:local</code> çalıştırın.</li>
          <li>QR sayfası dışarıya açık değildir — sadece süper admin panelinden erişilir.</li>
        </ul>
      </Card>
    </div>
  );
}
