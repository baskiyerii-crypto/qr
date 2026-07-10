import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/StatCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { Store, Building2, Users, Wallet, Plus } from 'lucide-react';

export function MarketerDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['marketer-dashboard'],
    queryFn: () => api.get<{
      marketer: { companyName: string; code: string; commissionRate: number };
      stats: { totalResellers: number; directCompanies: number; resellerCompanies: number; monthlyCommission: number };
      resellers: Array<{ id: string; companyName: string; code: string; clientCount: number }>;
      directCompanies: Array<{ id: string; name: string; employeeCount: number }>;
    }>('/marketer/dashboard'),
  });

  if (isLoading) return <p className="text-slate-500">Yükleniyor...</p>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={data?.marketer.companyName ?? 'Pazarlamacı Paneli'}
        description={`Kod: ${data?.marketer.code ?? '—'} · Komisyon: %${((data?.marketer.commissionRate || 0) * 100).toFixed(0)}`}
        icon={<Store className="h-5 w-5" />}
        actions={
          <>
            <Link to="/marketer/resellers"><Button variant="secondary"><Plus className="h-4 w-4" /> Yeni Bayi</Button></Link>
            <Link to="/marketer/companies"><Button><Plus className="h-4 w-4" /> Yeni Müşteri</Button></Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard title="Bayi" value={data?.stats.totalResellers ?? 0} icon={<Store className="h-5 w-5" />} />
        <StatCard title="Doğrudan müşteri" value={data?.stats.directCompanies ?? 0} icon={<Building2 className="h-5 w-5" />} />
        <StatCard title="Bayi müşterileri" value={data?.stats.resellerCompanies ?? 0} icon={<Users className="h-5 w-5" />} />
        <StatCard title="Bu ay komisyon" value={`${(data?.stats.monthlyCommission ?? 0).toLocaleString('tr-TR')} ₺`} icon={<Wallet className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card padded={false}>
          <CardHeader className="border-b border-slate-100 px-6 py-4"><CardTitle>Bayilerim</CardTitle></CardHeader>
          <div className="divide-y divide-slate-100">
            {data?.resellers.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-6 py-3 text-sm">
                <span className="flex items-center gap-2 text-slate-700">{r.companyName} <Badge variant="primary">{r.code}</Badge></span>
                <span className="text-slate-500">{r.clientCount} müşteri</span>
              </div>
            ))}
            {!data?.resellers.length && <p className="px-6 py-6 text-center text-sm text-slate-400">Henüz bayi yok</p>}
          </div>
        </Card>
        <Card padded={false}>
          <CardHeader className="border-b border-slate-100 px-6 py-4"><CardTitle>Doğrudan Müşteriler</CardTitle></CardHeader>
          <div className="divide-y divide-slate-100">
            {data?.directCompanies.map((c) => (
              <Link key={c.id} to="/marketer/companies/$id" params={{ id: c.id }} className="flex items-center justify-between px-6 py-3 text-sm transition-colors hover:bg-slate-50">
                <span className="font-medium text-slate-900">{c.name}</span>
                <span className="text-slate-500">{c.employeeCount} personel</span>
              </Link>
            ))}
            {!data?.directCompanies.length && <p className="px-6 py-6 text-center text-sm text-slate-400">Henüz doğrudan müşteri yok</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
