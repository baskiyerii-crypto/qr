import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { LayoutDashboard, Building2, Store, Users, Inbox, Wallet, BadgeCheck, MessageCircle } from 'lucide-react';

type Overview = {
  stats: {
    totalCompanies: number;
    totalResellers: number;
    totalEmployees: number;
    pendingApplications: number;
    monthlyPlatformRevenue: number;
    activeSubscriptions: number;
    whatsappState: string;
  };
  recentPayments: Array<{
    id: string;
    amount: number;
    platformAmount: number;
    status: string;
    createdAt: string;
    company: { name: string };
    reseller: { companyName: string; code: string } | null;
    plan: { name: string } | null;
  }>;
  recentApplications: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    status: string;
    createdAt: string;
  }>;
};

const WA_LABELS: Record<string, string> = {
  open: 'Bağlı',
  connecting: 'Bağlanıyor',
  close: 'Kapalı',
  unknown: 'Bilinmiyor',
  unconfigured: 'Yapılandırılmamış',
};

export function AdminOverviewPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => api.get<Overview>('/admin/overview'),
  });

  const s = data?.stats;

  return (
    <div className="space-y-8">
      <PageHeader title="Genel Bakış" description="Platform KPI özeti" icon={<LayoutDashboard className="h-5 w-5" />} />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Şirketler" value={s?.totalCompanies ?? 0} icon={<Building2 className="h-5 w-5" />} />
          <StatCard title="Aktif Bayiler" value={s?.totalResellers ?? 0} icon={<Store className="h-5 w-5" />} />
          <StatCard title="Personel" value={s?.totalEmployees ?? 0} icon={<Users className="h-5 w-5" />} />
          <StatCard title="Bekleyen Başvuru" value={s?.pendingApplications ?? 0} icon={<Inbox className="h-5 w-5" />} />
          <StatCard title="Bu Ay Platform Geliri" value={`${(s?.monthlyPlatformRevenue ?? 0).toLocaleString('tr-TR')} ₺`} icon={<Wallet className="h-5 w-5" />} />
          <StatCard title="Aktif Abonelik" value={s?.activeSubscriptions ?? 0} icon={<BadgeCheck className="h-5 w-5" />} />
          <Card hover className="flex flex-col justify-between">
            <div className="flex items-center gap-2 text-slate-500"><MessageCircle className="h-5 w-5" /><span className="text-sm">WhatsApp</span></div>
            <div className="mt-3"><Badge variant={s?.whatsappState === 'open' ? 'success' : 'default'} dot>{WA_LABELS[s?.whatsappState ?? ''] || s?.whatsappState}</Badge></div>
          </Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card padded={false}>
          <CardHeader className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <CardTitle>Son Ödemeler</CardTitle>
            <Link to="/admin/payments" className="text-sm font-medium text-primary hover:underline">Tümü</Link>
          </CardHeader>
          <div className="divide-y divide-slate-100">
            {data?.recentPayments.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-6 py-3">
                <div>
                  <p className="font-medium text-slate-900">{p.company.name}</p>
                  <p className="text-xs text-slate-400">{new Date(p.createdAt).toLocaleDateString('tr-TR')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm">{p.amount.toLocaleString('tr-TR')} ₺</span>
                  <Badge variant={p.status === 'PAID' || p.status === 'SUCCESS' ? 'success' : 'default'}>{p.status}</Badge>
                </div>
              </div>
            ))}
            {!data?.recentPayments.length && <p className="px-6 py-6 text-center text-sm text-slate-400">Ödeme yok</p>}
          </div>
        </Card>

        <Card padded={false}>
          <CardHeader className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <CardTitle>Son Başvurular</CardTitle>
            <Link to="/admin/applications" className="text-sm font-medium text-primary hover:underline">Tümü</Link>
          </CardHeader>
          <div className="divide-y divide-slate-100">
            {data?.recentApplications.map((a) => (
              <div key={a.id} className="flex items-center justify-between px-6 py-3">
                <div>
                  <p className="font-medium text-slate-900">{a.firstName} {a.lastName}</p>
                  <p className="text-xs text-slate-400">{a.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge>{a.status}</Badge>
                  <span className="text-xs text-slate-400">{new Date(a.createdAt).toLocaleDateString('tr-TR')}</span>
                </div>
              </div>
            ))}
            {!data?.recentApplications.length && <p className="px-6 py-6 text-center text-sm text-slate-400">Başvuru yok</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
