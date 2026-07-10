import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { StatCard } from '@/components/ui/StatCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { BarChart3, Store, Building2, Users, Wallet } from 'lucide-react';

export function MarketerPerformancePage() {
  const { data } = useQuery({
    queryKey: ['marketer-analytics'],
    queryFn: () => api.get<{
      totalResellers: number; directCompanies: number; resellerCompanies: number; monthlyCommission: number;
    }>('/marketer/analytics'),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Performans" description="Ağınızın genel görünümü" icon={<BarChart3 className="h-5 w-5" />} />
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard title="Bayi" value={data?.totalResellers ?? 0} icon={<Store className="h-5 w-5" />} />
        <StatCard title="Doğrudan müşteri" value={data?.directCompanies ?? 0} icon={<Building2 className="h-5 w-5" />} />
        <StatCard title="Bayi müşterileri" value={data?.resellerCompanies ?? 0} icon={<Users className="h-5 w-5" />} />
        <StatCard title="Aylık komisyon" value={`${(data?.monthlyCommission ?? 0).toLocaleString('tr-TR')} ₺`} icon={<Wallet className="h-5 w-5" />} />
      </div>
    </div>
  );
}
