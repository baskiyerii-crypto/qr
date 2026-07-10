import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Plus, Store } from 'lucide-react';

type Reseller = {
  id: string;
  companyName: string;
  code: string;
  commissionRate: number;
  isActive: boolean;
  iyzicoOnboardingStatus: string;
  user: { email: string; firstName: string; lastName: string; isActive: boolean };
  _count: { companies: number };
};

export function AdminResellersPage() {
  const { data: resellers, isLoading } = useQuery({
    queryKey: ['admin-resellers'],
    queryFn: () => api.get<Reseller[]>('/admin/resellers'),
  });

  const columns: Column<Reseller>[] = [
    { key: 'name', header: 'Bayi', render: (r) => (<div><p className="font-medium text-slate-900">{r.companyName}</p><p className="text-xs text-slate-400">{r.user.email}</p></div>) },
    { key: 'code', header: 'Kod', render: (r) => <Badge variant="primary">{r.code}</Badge> },
    { key: 'companies', header: 'Müşteri', render: (r) => r._count.companies },
    { key: 'commission', header: 'Komisyon', render: (r) => `%${(r.commissionRate * 100).toFixed(0)}` },
    { key: 'iyzico', header: 'iyzico', render: (r) => <Badge>{r.iyzicoOnboardingStatus}</Badge> },
    { key: 'status', header: 'Durum', render: (r) => <Badge variant={r.isActive ? 'success' : 'error'} dot>{r.isActive ? 'Aktif' : 'Pasif'}</Badge> },
    { key: 'actions', header: '', align: 'right', render: (r) => <Link to="/admin/resellers/$id" params={{ id: r.id }} className="text-sm font-medium text-primary hover:underline">Detay</Link> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bayiler"
        description="Platform bayileri ve komisyon oranları"
        icon={<Store className="h-5 w-5" />}
        actions={<Link to="/admin/resellers/new"><Button><Plus className="h-4 w-4" /> Yeni Bayi</Button></Link>}
      />
      <DataTable columns={columns} data={resellers} loading={isLoading} rowKey={(r) => r.id} emptyTitle="Bayi yok" emptyDescription="İlk bayiyi ekleyin." emptyIcon={<Store className="h-6 w-6" />} />
    </div>
  );
}
