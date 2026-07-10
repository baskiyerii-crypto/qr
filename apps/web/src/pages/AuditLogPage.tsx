import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { ScrollText } from 'lucide-react';

interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actor: { firstName: string; lastName: string; email: string } | null;
}

export function AuditLogPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['audit'],
    queryFn: () => api.get<AuditEntry[]>('/audit?limit=200'),
  });

  const columns: Column<AuditEntry>[] = [
    { key: 'date', header: 'Tarih', render: (e) => <span className="whitespace-nowrap text-slate-500">{new Date(e.createdAt).toLocaleString('tr-TR')}</span> },
    { key: 'actor', header: 'Kullanıcı', render: (e) => (e.actor ? `${e.actor.firstName} ${e.actor.lastName}` : 'Sistem') },
    { key: 'action', header: 'İşlem', render: (e) => <Badge variant="primary">{e.action}</Badge> },
    { key: 'entity', header: 'Varlık', render: (e) => <span className="text-slate-500">{e.entityType} · {e.entityId.slice(0, 8)}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Denetim Kaydı" description="Sistem üzerindeki kritik işlemler" icon={<ScrollText className="h-5 w-5" />} />
      <DataTable columns={columns} data={data} loading={isLoading} rowKey={(e) => e.id} emptyTitle="Kayıt yok" emptyDescription="Denetim kaydı bulunmuyor." emptyIcon={<ScrollText className="h-6 w-6" />} />
    </div>
  );
}
