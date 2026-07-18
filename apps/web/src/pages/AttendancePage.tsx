import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { QrCode } from 'lucide-react';

type Record = {
  id: string;
  type: string;
  serverTimestamp: string;
  withinGeofence: boolean;
  isManual: boolean;
  employee: { user: { firstName: string; lastName: string } };
  branch: { name: string };
};

export function AttendancePage() {
  const { data: records, isLoading } = useQuery({
    queryKey: ['attendance'],
    queryFn: () => api.get<Record[]>('/attendance'),
  });

  const columns: Column<Record>[] = [
    {
      key: 'employee',
      header: 'Personel',
      render: (r) => (
        <div className="flex items-center gap-3">
          <Avatar name={`${r.employee.user.firstName} ${r.employee.user.lastName}`} size="sm" />
          <span className="font-medium text-slate-900">{r.employee.user.firstName} {r.employee.user.lastName}</span>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'İşlem',
      render: (r) => {
        const label =
          r.type === 'CHECK_IN'
            ? 'Giriş'
            : r.type === 'CHECK_OUT'
              ? 'Çıkış'
              : r.type === 'MEAL_START'
                ? 'Yemeğe çıkış'
                : r.type === 'MEAL_END'
                  ? 'Yemekten dönüş'
                  : r.type;
        const variant =
          r.type === 'CHECK_IN' || r.type === 'MEAL_END'
            ? 'success'
            : r.type === 'MEAL_START'
              ? 'warning'
              : 'info';
        return (
          <div className="flex items-center gap-1">
            <Badge variant={variant} dot>
              {label}
            </Badge>
            {r.isManual && <Badge>Manuel</Badge>}
          </div>
        );
      },
    },
    { key: 'branch', header: 'Şube', render: (r) => r.branch.name },
    {
      key: 'time',
      header: 'Zaman',
      render: (r) => <span className="text-slate-500">{new Date(r.serverTimestamp).toLocaleString('tr-TR')}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Devam Kayıtları" description="Tüm giriş-çıkış hareketleri" icon={<QrCode className="h-5 w-5" />} />
      <DataTable
        columns={columns}
        data={records}
        loading={isLoading}
        rowKey={(r) => r.id}
        emptyTitle="Kayıt yok"
        emptyDescription="Henüz devam kaydı bulunmuyor."
      />
    </div>
  );
}
