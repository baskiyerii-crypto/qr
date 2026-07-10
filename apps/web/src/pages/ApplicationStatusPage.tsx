import { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { MarketingHeader } from '@/components/layout/MarketingHeader';
import { MarketingFooter } from '@/components/layout/MarketingFooter';
import { Search } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: 'Gönderildi',
  UNDER_REVIEW: 'İnceleniyor',
  APPROVED: 'Onaylandı',
  REJECTED: 'Reddedildi',
};

export function ApplicationStatusPage() {
  const params = new URLSearchParams(window.location.search);
  const [applicationId, setApplicationId] = useState(params.get('id') || '');
  const [phone, setPhone] = useState(params.get('phone') || '');
  const [data, setData] = useState<{
    status: string;
    firstName: string;
    createdAt: string;
    rejectionReason?: string;
    events: Array<{ type: string; message: string; createdAt: string }>;
  } | null>(null);
  const [error, setError] = useState('');

  const check = async () => {
    setError('');
    try {
      const result = await api.get<typeof data>(
        `/reseller-applications/${applicationId}/status?phone=${encodeURIComponent(phone)}`,
      );
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sorgu başarısız');
      setData(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <MarketingHeader />
      <div className="mx-auto w-full max-w-lg flex-1 px-4 py-10">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-primary"><Search className="h-5 w-5" /></div>
          <h1 className="text-2xl font-bold text-slate-900">Başvuru Durumu</h1>
        </div>
        <Card className="mt-6 shadow-elevated">
          <div className="space-y-4">
            <Input placeholder="Başvuru No (UUID)" value={applicationId} onChange={(e) => setApplicationId(e.target.value)} />
            <Input placeholder="Telefon numaranız" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Button className="w-full" onClick={check}>Sorgula</Button>
          </div>
          {error && <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}
          {data && (
            <div className="mt-6 space-y-4 border-t border-slate-100 pt-6">
              <div className="flex items-center justify-between">
                <span className="font-medium">{data.firstName}</span>
                <Badge variant={data.status === 'APPROVED' ? 'success' : data.status === 'REJECTED' ? 'error' : 'warning'}>
                  {STATUS_LABELS[data.status] || data.status}
                </Badge>
              </div>
              {data.rejectionReason && (
                <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{data.rejectionReason}</p>
              )}
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Süreç geçmişi</h3>
                <ol className="mt-2 space-y-2">
                  {data.events.map((e, i) => (
                    <li key={i} className="text-xs text-slate-600">
                      <span className="font-medium">{e.type}</span> — {e.message || '-'}
                      <br />
                      <span className="text-slate-400">{new Date(e.createdAt).toLocaleString('tr-TR')}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </Card>
      </div>
      <MarketingFooter />
    </div>
  );
}
