import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Wallet } from 'lucide-react';

type Payment = {
  id: string;
  amount: number;
  platformAmount: number;
  resellerAmount: number;
  status: string;
  iyzicoPaymentId: string | null;
  createdAt: string;
  paidAt: string | null;
  company: { name: string };
  reseller: { companyName: string; code: string } | null;
  plan: { name: string } | null;
};

export function AdminPaymentsPage() {
  const [status, setStatus] = useState('');

  const { data: payments, isLoading } = useQuery({
    queryKey: ['admin-payments', status],
    queryFn: () => api.get<Payment[]>(`/admin/payments${status ? `?status=${status}` : ''}`),
  });

  const columns: Column<Payment>[] = [
    { key: 'date', header: 'Tarih', render: (p) => new Date(p.createdAt).toLocaleDateString('tr-TR') },
    { key: 'company', header: 'Şirket', render: (p) => <span className="font-medium text-slate-900">{p.company.name}</span> },
    { key: 'reseller', header: 'Bayi', render: (p) => <span className="text-slate-500">{p.reseller ? `${p.reseller.companyName} (${p.reseller.code})` : '—'}</span> },
    { key: 'amount', header: 'Tutar', render: (p) => `${p.amount.toLocaleString('tr-TR')} ₺` },
    { key: 'platform', header: 'Platform', render: (p) => `${p.platformAmount.toLocaleString('tr-TR')} ₺` },
    { key: 'resellerAmt', header: 'Bayi payı', render: (p) => `${p.resellerAmount.toLocaleString('tr-TR')} ₺` },
    { key: 'iyzico', header: 'iyzico ID', render: (p) => <span className="font-mono text-xs">{p.iyzicoPaymentId?.slice(0, 12) ?? '—'}</span> },
    { key: 'status', header: 'Durum', render: (p) => <Badge variant={p.status === 'SUCCESS' ? 'success' : p.status === 'FAILED' ? 'error' : 'warning'} dot>{p.status}</Badge> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ödemeler"
        description="Tüm platform ödemeleri ve komisyon dağılımı"
        icon={<Wallet className="h-5 w-5" />}
        actions={
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-44">
            <option value="">Tüm durumlar</option>
            <option value="SUCCESS">Ödendi</option>
            <option value="PENDING">Bekliyor</option>
            <option value="FAILED">Başarısız</option>
          </Select>
        }
      />
      <DataTable columns={columns} data={payments} loading={isLoading} rowKey={(p) => p.id} emptyTitle="Ödeme yok" emptyDescription="Filtreye uyan ödeme bulunamadı." emptyIcon={<Wallet className="h-6 w-6" />} />
    </div>
  );
}
