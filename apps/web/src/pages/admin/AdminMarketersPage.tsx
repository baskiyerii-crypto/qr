import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Plus, Megaphone } from 'lucide-react';

type Marketer = {
  id: string; companyName: string; code: string; commissionRate: number; isActive: boolean;
  user: { email: string; firstName: string; lastName: string };
  _count: { resellers: number; companies: number };
};

export function AdminMarketersPage() {
  const { data: marketers, isLoading } = useQuery({
    queryKey: ['admin-marketers'],
    queryFn: () => api.get<Marketer[]>('/admin/marketers'),
  });

  const columns: Column<Marketer>[] = [
    { key: 'name', header: 'Firma', render: (m) => (<div><p className="font-medium text-slate-900">{m.companyName}</p><p className="text-xs text-slate-400">{m.user.email}</p></div>) },
    { key: 'code', header: 'Kod', render: (m) => <Badge variant="primary">{m.code}</Badge> },
    { key: 'resellers', header: 'Bayi', render: (m) => m._count.resellers },
    { key: 'companies', header: 'Doğrudan müşteri', render: (m) => m._count.companies },
    { key: 'commission', header: 'Komisyon', render: (m) => `%${(m.commissionRate * 100).toFixed(0)}` },
    { key: 'actions', header: '', align: 'right', render: (m) => <Link to="/admin/marketers/$id" params={{ id: m.id }} className="text-sm font-medium text-primary hover:underline">Detay</Link> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pazarlamacılar"
        description="Pazarlamacı hiyerarşisi ve komisyonları"
        icon={<Megaphone className="h-5 w-5" />}
        actions={<Link to="/admin/marketers/new"><Button><Plus className="h-4 w-4" /> Yeni Pazarlamacı</Button></Link>}
      />
      <DataTable columns={columns} data={marketers} loading={isLoading} rowKey={(m) => m.id} emptyTitle="Pazarlamacı yok" emptyDescription="İlk pazarlamacıyı ekleyin." emptyIcon={<Megaphone className="h-6 w-6" />} />
    </div>
  );
}
