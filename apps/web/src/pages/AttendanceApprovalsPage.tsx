import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/StatCard';
import { ClipboardCheck } from 'lucide-react';

interface PendingRecord {
  id: string;
  type: string;
  serverTimestamp: string;
  notes: string | null;
  latitude: number;
  longitude: number;
  employee: { user: { firstName: string; lastName: string } };
  branch: { name: string };
}

export function AttendanceApprovalsPage() {
  const qc = useQueryClient();
  const { data: records, isLoading } = useQuery({
    queryKey: ['attendance-approvals'],
    queryFn: () => api.get<PendingRecord[]>('/attendance/pending-approvals'),
  });

  const review = useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) =>
      api.patch(`/attendance/${id}/review`, { approve }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attendance-approvals'] }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Şube Dışı Giriş Onayları"
        description="Görev yeri dışındaki şubelerde yapılan giriş/çıkışları inceleyin"
        icon={<ClipboardCheck className="h-5 w-5" />}
      />
      <Card padded={false}>
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
          </div>
        ) : records && records.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {records.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  <Avatar name={`${r.employee.user.firstName} ${r.employee.user.lastName}`} size="sm" />
                  <div>
                    <p className="font-medium text-slate-900">{r.employee.user.firstName} {r.employee.user.lastName}</p>
                    <p className="text-sm text-slate-500">
                      {r.type === 'CHECK_IN' ? 'Giriş' : 'Çıkış'} · {r.branch.name} ·{' '}
                      {new Date(r.serverTimestamp).toLocaleString('tr-TR')}
                    </p>
                    {r.notes && <p className="text-sm text-slate-400">Gerekçe: {r.notes}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="warning" dot>Bekliyor</Badge>
                  <Button size="sm" onClick={() => review.mutate({ id: r.id, approve: true })}>Onayla</Button>
                  <Button size="sm" variant="danger" onClick={() => review.mutate({ id: r.id, approve: false })}>Reddet</Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Onay bekleyen giriş yok" description="Şube dışı tüm girişler incelendi." icon={<ClipboardCheck className="h-6 w-6" />} />
        )}
      </Card>
    </div>
  );
}
