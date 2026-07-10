import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { ScrollText } from 'lucide-react';

type LogEntry = {
  id: string;
  type: string;
  message: string | null;
  createdAt: string;
  application: {
    firstName: string;
    lastName: string;
    email: string;
    companyName: string | null;
  };
};

export function AdminLogsPage() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['admin-activity-log'],
    queryFn: () => api.get<LogEntry[]>('/admin/activity-log'),
  });

  const columns: Column<LogEntry>[] = [
    { key: 'date', header: 'Tarih', render: (l) => <span className="whitespace-nowrap text-slate-400">{new Date(l.createdAt).toLocaleString('tr-TR')}</span> },
    { key: 'applicant', header: 'Başvuran', render: (l) => (<div><p className="font-medium text-slate-900">{l.application.firstName} {l.application.lastName}</p><p className="text-xs text-slate-400">{l.application.email}</p></div>) },
    { key: 'type', header: 'Olay', render: (l) => <Badge variant="primary">{l.type}</Badge> },
    { key: 'message', header: 'Mesaj', render: (l) => <span className="text-slate-500">{l.message ?? '—'}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Sistem Kayıtları" description="Bayi başvuru olayları ve platform aktiviteleri" icon={<ScrollText className="h-5 w-5" />} />
      <DataTable columns={columns} data={logs} loading={isLoading} rowKey={(l) => l.id} emptyTitle="Kayıt yok" emptyDescription="Sistem kaydı bulunmuyor." emptyIcon={<ScrollText className="h-6 w-6" />} />
    </div>
  );
}
