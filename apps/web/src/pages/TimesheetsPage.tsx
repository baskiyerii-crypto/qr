import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { ClipboardList } from 'lucide-react';

type TimesheetRow = {
  employee: { id: string; user: { firstName: string; lastName: string } };
  summary: {
    totalWorkedMinutes: number;
    totalOvertimeMinutes: number;
    totalMissingMinutes: number;
    absentDays: number;
  };
};

export function TimesheetsPage() {
  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;

  const { data, isLoading } = useQuery({
    queryKey: ['timesheets', year, month],
    queryFn: () => api.get<TimesheetRow[]>(`/timesheets?year=${year}&month=${month}`),
  });

  const formatHours = (m: number) => `${Math.floor(m / 60)}s ${m % 60}dk`;

  const columns: Column<TimesheetRow>[] = [
    {
      key: 'employee',
      header: 'Personel',
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={`${row.employee.user.firstName} ${row.employee.user.lastName}`} size="sm" />
          <span className="font-medium text-slate-900">{row.employee.user.firstName} {row.employee.user.lastName}</span>
        </div>
      ),
    },
    { key: 'worked', header: 'Çalışılan', render: (row) => formatHours(row.summary.totalWorkedMinutes) },
    { key: 'overtime', header: 'Fazla mesai', render: (row) => <span className="text-emerald-600">{formatHours(row.summary.totalOvertimeMinutes)}</span> },
    { key: 'missing', header: 'Eksik', render: (row) => <span className="text-amber-600">{formatHours(row.summary.totalMissingMinutes)}</span> },
    { key: 'absent', header: 'Devamsız', render: (row) => `${row.summary.absentDays} gün` },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Puantaj" description={`${month}/${year} dönemi özeti`} icon={<ClipboardList className="h-5 w-5" />} />
      <DataTable
        columns={columns}
        data={data}
        loading={isLoading}
        rowKey={(row) => row.employee.id}
        emptyTitle="Puantaj kaydı yok"
        emptyDescription="Bu dönem için puantaj verisi bulunmuyor."
        emptyIcon={<ClipboardList className="h-6 w-6" />}
      />
    </div>
  );
}
