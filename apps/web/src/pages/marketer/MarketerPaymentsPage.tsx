import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { Wallet } from 'lucide-react';

export function MarketerPaymentsPage() {
  const { data } = useQuery({
    queryKey: ['marketer-payments'],
    queryFn: () => api.get<{
      totalCommission: number; monthlyCommission: number;
      payments: Array<{ id: string; marketerAmount: number; paidAt: string; company: { name: string }; reseller?: { companyName: string } | null }>;
    }>('/marketer/payments'),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Komisyon Geçmişi" description="Kazandığınız komisyonlar" icon={<Wallet className="h-5 w-5" />} />
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard title="Toplam" value={`${(data?.totalCommission ?? 0).toLocaleString('tr-TR')} ₺`} icon={<Wallet className="h-5 w-5" />} />
        <StatCard title="Bu ay" value={`${(data?.monthlyCommission ?? 0).toLocaleString('tr-TR')} ₺`} />
      </div>
      <Card padded={false}>
        <div className="divide-y divide-slate-100">
          {data?.payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-6 py-3.5 text-sm">
              <span className="text-slate-700">{p.company.name}{p.reseller ? ` · ${p.reseller.companyName}` : ''}</span>
              <span className="font-semibold text-emerald-600">+{p.marketerAmount.toLocaleString('tr-TR')} ₺</span>
            </div>
          ))}
          {!data?.payments.length && <p className="px-6 py-6 text-center text-sm text-slate-400">Ödeme yok</p>}
        </div>
      </Card>
    </div>
  );
}
