import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Field } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { Percent, Wallet, Store, Megaphone } from 'lucide-react';

type Summary = {
  monthTotals: { platform: number; reseller: number; marketer: number; gross: number };
  resellers: Array<{
    id: string; companyName: string; code: string; commissionRate: number;
    marketerName: string | null; clientCount: number; monthlyCommission: number; isActive: boolean;
  }>;
  marketers: Array<{
    id: string; companyName: string; code: string; commissionRate: number;
    resellerCount: number; directClientCount: number; monthlyCommission: number; isActive: boolean;
  }>;
};

export function AdminCommissionsPage() {
  const qc = useQueryClient();

  const { data: summary } = useQuery({
    queryKey: ['admin-commissions'],
    queryFn: () => api.get<Summary>('/admin/commissions/summary'),
  });

  const { data: payoutConfig } = useQuery({
    queryKey: ['payout-config'],
    queryFn: () => api.get<{ payoutFrequency: string; holdDays: number; minimumPayoutAmount: number }>('/admin/payout-config'),
  });

  const savePayout = useMutation({
    mutationFn: (body: { payoutFrequency?: string; holdDays?: number; minimumPayoutAmount?: number }) =>
      api.patch('/admin/payout-config', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payout-config'] }),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Komisyon & Dağıtım" description="Aylık komisyon özeti ve payout ayarları" icon={<Percent className="h-5 w-5" />} />

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard title="Bu Ay Brüt" value={`${(summary?.monthTotals.gross ?? 0).toLocaleString('tr-TR')} ₺`} icon={<Wallet className="h-5 w-5" />} />
        <StatCard title="Platform Payı" value={`${(summary?.monthTotals.platform ?? 0).toLocaleString('tr-TR')} ₺`} />
        <StatCard title="Bayi Payı" value={`${(summary?.monthTotals.reseller ?? 0).toLocaleString('tr-TR')} ₺`} icon={<Store className="h-5 w-5" />} />
        <StatCard title="Pazarlamacı Payı" value={`${(summary?.monthTotals.marketer ?? 0).toLocaleString('tr-TR')} ₺`} icon={<Megaphone className="h-5 w-5" />} />
      </div>

      <Card>
        <CardHeader><CardTitle>Payout Ayarları</CardTitle></CardHeader>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Dağıtım periyodu">
            <Select defaultValue={payoutConfig?.payoutFrequency || 'INSTANT'} onChange={(e) => savePayout.mutate({ payoutFrequency: e.target.value })}>
              <option value="INSTANT">Anlık (Marketplace split)</option>
              <option value="WEEKLY">Haftalık rapor</option>
              <option value="MONTHLY">Aylık rapor</option>
            </Select>
          </Field>
          <Field label="Bekleme süresi (gün)">
            <Input type="number" defaultValue={payoutConfig?.holdDays ?? 0} onBlur={(e) => savePayout.mutate({ holdDays: parseInt(e.target.value) })} />
          </Field>
          <Field label="Min. tutar (₺)">
            <Input type="number" defaultValue={payoutConfig?.minimumPayoutAmount ?? 0} onBlur={(e) => savePayout.mutate({ minimumPayoutAmount: parseFloat(e.target.value) })} />
          </Field>
        </div>
      </Card>

      <Card padded={false}>
        <CardHeader className="border-b border-slate-100 px-6 py-4"><CardTitle>Bayi Bazlı Komisyon Özeti (Bu Ay)</CardTitle></CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-6 py-3">Bayi</th><th className="px-6 py-3">Kod</th><th className="px-6 py-3">Pazarlamacı</th>
                <th className="px-6 py-3">Müşteri</th><th className="px-6 py-3">Komisyon %</th><th className="px-6 py-3">Bu Ay</th><th className="px-6 py-3">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {summary?.resellers.map((r) => (
                <tr key={r.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-6 py-3.5 font-medium text-slate-900">{r.companyName}</td>
                  <td className="px-6 py-3.5"><Badge variant="primary">{r.code}</Badge></td>
                  <td className="px-6 py-3.5 text-slate-500">{r.marketerName || '—'}</td>
                  <td className="px-6 py-3.5">{r.clientCount}</td>
                  <td className="px-6 py-3.5">%{(r.commissionRate * 100).toFixed(0)}</td>
                  <td className="px-6 py-3.5">{r.monthlyCommission.toLocaleString('tr-TR')} ₺</td>
                  <td className="px-6 py-3.5"><Badge variant={r.isActive ? 'success' : 'error'} dot>{r.isActive ? 'Aktif' : 'Pasif'}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card padded={false}>
        <CardHeader className="border-b border-slate-100 px-6 py-4"><CardTitle>Pazarlamacı Bazlı Komisyon (Bu Ay)</CardTitle></CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-6 py-3">Pazarlamacı</th><th className="px-6 py-3">Kod</th><th className="px-6 py-3">Bayi</th>
                <th className="px-6 py-3">Doğrudan müşteri</th><th className="px-6 py-3">Komisyon %</th><th className="px-6 py-3">Bu Ay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {summary?.marketers.map((m) => (
                <tr key={m.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-6 py-3.5 font-medium text-slate-900">{m.companyName}</td>
                  <td className="px-6 py-3.5"><Badge variant="primary">{m.code}</Badge></td>
                  <td className="px-6 py-3.5">{m.resellerCount}</td>
                  <td className="px-6 py-3.5">{m.directClientCount}</td>
                  <td className="px-6 py-3.5">%{(m.commissionRate * 100).toFixed(0)}</td>
                  <td className="px-6 py-3.5">{m.monthlyCommission.toLocaleString('tr-TR')} ₺</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
