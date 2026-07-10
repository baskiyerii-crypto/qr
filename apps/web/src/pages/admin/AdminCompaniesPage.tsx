import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Building2 } from 'lucide-react';

type Company = {
  id: string;
  name: string;
  createdAt: string;
  reseller: { id: string; companyName: string; code: string } | null;
  subscription: { status: string; plan: { name: string } } | null;
  _count: { employees: number; branches: number };
};

export function AdminCompaniesPage() {
  const [search, setSearch] = useState('');
  const [resellerFilter, setResellerFilter] = useState('');

  const { data: companies, isLoading } = useQuery({
    queryKey: ['admin-companies'],
    queryFn: () => api.get<Company[]>('/admin/companies'),
  });

  const filtered = companies?.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.name.toLowerCase().includes(q);
    const matchReseller = !resellerFilter || c.reseller?.id === resellerFilter;
    return matchSearch && matchReseller;
  });

  const resellers = [...new Map(
    (companies ?? []).filter((c) => c.reseller).map((c) => [c.reseller!.id, c.reseller!]),
  ).values()];

  const columns: Column<Company>[] = [
    { key: 'name', header: 'Şirket', render: (c) => <span className="font-medium text-slate-900">{c.name}</span> },
    { key: 'reseller', header: 'Bayi', render: (c) => <span className="text-slate-500">{c.reseller ? `${c.reseller.companyName} (${c.reseller.code})` : 'Doğrudan'}</span> },
    { key: 'sub', header: 'Abonelik', render: (c) => (c.subscription ? <span className="flex items-center gap-1"><Badge variant={c.subscription.status === 'ACTIVE' ? 'success' : 'default'}>{c.subscription.status}</Badge> {c.subscription.plan.name}</span> : '—') },
    { key: 'emp', header: 'Personel', render: (c) => c._count.employees },
    { key: 'created', header: 'Oluşturulma', render: (c) => <span className="text-slate-400">{new Date(c.createdAt).toLocaleDateString('tr-TR')}</span> },
    { key: 'actions', header: '', align: 'right', render: (c) => <Link to="/admin/companies/$id" params={{ id: c.id }} className="text-sm font-medium text-primary hover:underline">Detay</Link> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Şirketler" description="Platformdaki tüm şirketler" icon={<Building2 className="h-5 w-5" />} />

      <div className="flex flex-wrap gap-3">
        <Input placeholder="Şirket ara…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={resellerFilter} onChange={(e) => setResellerFilter(e.target.value)} className="w-56">
          <option value="">Tüm bayiler</option>
          {resellers.map((r) => <option key={r.id} value={r.id}>{r.companyName} ({r.code})</option>)}
        </Select>
      </div>

      <DataTable columns={columns} data={filtered} loading={isLoading} rowKey={(c) => c.id} emptyTitle="Şirket yok" emptyDescription="Filtreye uyan şirket bulunamadı." emptyIcon={<Building2 className="h-6 w-6" />} />
    </div>
  );
}
