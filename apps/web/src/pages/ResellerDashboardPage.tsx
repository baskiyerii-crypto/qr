import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/StatCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { Store, Building2, Users, Wallet, Plus } from 'lucide-react';

export function ResellerDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['reseller-dashboard'],
    queryFn: () => api.get<{
      reseller: { companyName: string; code: string; commissionRate: number; iyzicoOnboardingStatus?: string };
      stats: { totalCompanies: number; totalEmployees: number; monthlyCommission: number };
      companies: Array<{ id: string; name: string; employeeCount: number; commission: number; monthlyFee: number }>;
    }>('/reseller/dashboard'),
  });

  const { data: payments } = useQuery({
    queryKey: ['reseller-payments'],
    queryFn: () => api.get<{
      totalCommission: number;
      monthlyCommission: number;
      payments: Array<{ id: string; resellerAmount: number; paidAt: string; company: { name: string }; plan: { name: string } | null }>;
    }>('/reseller/payments'),
  });

  if (isLoading) return <p className="text-slate-500">Yükleniyor...</p>;

  const realMonthly = payments?.monthlyCommission ?? 0;
  const realTotal = payments?.totalCommission ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={data?.reseller.companyName ?? 'Bayi Paneli'}
        description={`Bayi kodu: ${data?.reseller.code ?? '—'} · Komisyon: %${((data?.reseller.commissionRate || 0) * 100).toFixed(0)}`}
        icon={<Store className="h-5 w-5" />}
        actions={<Link to="/reseller/companies"><Button><Plus className="h-4 w-4" /> Yeni Müşteri</Button></Link>}
      />

      {data?.reseller.iyzicoOnboardingStatus && data.reseller.iyzicoOnboardingStatus !== 'REGISTERED' && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          iyzico alt üye kaydı: {data.reseller.iyzicoOnboardingStatus} — ödeme dağıtımı için IBAN bilgisi gerekebilir.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard title="Müşteri şirket" value={data?.stats.totalCompanies ?? 0} icon={<Building2 className="h-5 w-5" />} />
        <StatCard title="Toplam personel" value={data?.stats.totalEmployees ?? 0} icon={<Users className="h-5 w-5" />} />
        <StatCard title="Bu ay komisyon (iyzico)" value={`${realMonthly.toLocaleString('tr-TR')} ₺`} icon={<Wallet className="h-5 w-5" />} />
        <StatCard title="Toplam komisyon" value={`${realTotal.toLocaleString('tr-TR')} ₺`} />
      </div>

      {payments?.payments && payments.payments.length > 0 && (
        <Card padded={false}>
          <CardHeader className="border-b border-slate-100 px-6 py-4"><CardTitle>Son Ödemeler (iyzico Marketplace)</CardTitle></CardHeader>
          <div className="divide-y divide-slate-100">
            {payments.payments.slice(0, 10).map((p) => (
              <div key={p.id} className="flex items-center justify-between px-6 py-3 text-sm">
                <span className="text-slate-700">{p.company.name} — {p.plan?.name || 'Abonelik'}</span>
                <span className="font-semibold text-emerald-600">+{p.resellerAmount.toLocaleString('tr-TR')} ₺</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card padded={false}>
        <CardHeader className="border-b border-slate-100 px-6 py-4"><CardTitle>Müşteri Şirketlerim</CardTitle></CardHeader>
        {!data?.companies.length ? (
          <p className="px-6 py-6 text-center text-sm text-slate-400">Henüz müşteri yok. Bayi kodunuzu paylaşın: <strong className="text-slate-600">{data?.reseller.code}</strong></p>
        ) : (
          <div className="divide-y divide-slate-100">
            {data.companies.map((c) => (
              <Link key={c.id} to="/reseller/companies/$id" params={{ id: c.id }} className="flex items-center justify-between px-6 py-3.5 transition-colors hover:bg-slate-50">
                <div>
                  <p className="font-medium text-slate-900">{c.name}</p>
                  <p className="text-sm text-slate-500">{c.employeeCount} personel · {c.monthlyFee} ₺/ay</p>
                </div>
                <p className="font-semibold text-emerald-600">+{c.commission.toLocaleString('tr-TR')} ₺</p>
              </Link>
            ))}
          </div>
        )}
      </Card>

      <Card className="border-primary/20 bg-muted/40">
        <CardHeader><CardTitle>Müşteri kazanma</CardTitle></CardHeader>
        <p className="text-sm text-slate-600">
          Şirketler kayıt olurken bayi kodunuzu girer: <code className="rounded bg-card px-2 py-1 font-mono text-primary">{data?.reseller.code}</code>
        </p>
        <p className="mt-1 text-sm text-slate-500">Kayıt linki: {window.location.origin}/register?code={data?.reseller.code}</p>
      </Card>
    </div>
  );
}
