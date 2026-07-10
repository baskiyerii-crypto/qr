import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Select } from '@/components/ui/Select';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { BadgeCheck } from 'lucide-react';

type Subscription = {
  id: string;
  status: string;
  lastPaymentAt: string | null;
  nextBillingAt: string | null;
  company: { id: string; name: string };
  plan: { name: string; monthlyPrice: number };
};

const STATUSES = ['TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED'] as const;

export function AdminSubscriptionsPage() {
  const qc = useQueryClient();

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ['admin-subscriptions'],
    queryFn: () => api.get<Subscription[]>('/admin/subscriptions'),
  });

  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/admin/subscriptions/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-subscriptions'] }),
  });

  const columns: Column<Subscription>[] = [
    { key: 'company', header: 'Şirket', render: (s) => <span className="font-medium text-slate-900">{s.company.name}</span> },
    { key: 'plan', header: 'Plan', render: (s) => `${s.plan.name} (${s.plan.monthlyPrice} ₺)` },
    {
      key: 'status',
      header: 'Durum',
      render: (s) => (
        <Select className="w-36" value={s.status} onChange={(e) => update.mutate({ id: s.id, status: e.target.value })}>
          {STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
        </Select>
      ),
    },
    { key: 'last', header: 'Son ödeme', render: (s) => <span className="text-slate-400">{s.lastPaymentAt ? new Date(s.lastPaymentAt).toLocaleDateString('tr-TR') : '—'}</span> },
    { key: 'next', header: 'Sonraki fatura', render: (s) => <span className="text-slate-400">{s.nextBillingAt ? new Date(s.nextBillingAt).toLocaleDateString('tr-TR') : '—'}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Abonelikler" description="Şirket abonelik durumları" icon={<BadgeCheck className="h-5 w-5" />} />
      <DataTable columns={columns} data={subscriptions} loading={isLoading} rowKey={(s) => s.id} emptyTitle="Abonelik yok" emptyDescription="Kayıtlı abonelik bulunmuyor." emptyIcon={<BadgeCheck className="h-6 w-6" />} />
    </div>
  );
}
