import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/StatCard';
import { Calendar } from 'lucide-react';

export function LeavesPage() {
  const qc = useQueryClient();
  const { data: leaves, isLoading } = useQuery({
    queryKey: ['leaves'],
    queryFn: () => api.get<Array<{
      id: string;
      type: string;
      status: string;
      startDate: string;
      endDate: string;
      employee: { user: { firstName: string; lastName: string } };
    }>>('/leaves'),
  });

  const review = useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) =>
      api.post(`/leaves/${id}/review`, { approve }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leaves'] }),
  });

  const statusVariant = (s: string) => (s === 'PENDING' ? 'warning' : s === 'APPROVED' ? 'success' : 'error');

  return (
    <div className="space-y-6">
      <PageHeader title="İzin Talepleri" description="Personel izin taleplerini onaylayın veya reddedin" icon={<Calendar className="h-5 w-5" />} />
      <Card padded={false}>
        {isLoading ? (
          <div className="space-y-2 p-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
        ) : leaves && leaves.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {leaves.map((l) => (
              <div key={l.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  <Avatar name={`${l.employee.user.firstName} ${l.employee.user.lastName}`} size="sm" />
                  <div>
                    <p className="font-medium text-slate-900">{l.employee.user.firstName} {l.employee.user.lastName}</p>
                    <p className="text-sm text-slate-500">{l.type} · {new Date(l.startDate).toLocaleDateString('tr-TR')} – {new Date(l.endDate).toLocaleDateString('tr-TR')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={statusVariant(l.status)} dot>{l.status}</Badge>
                  {l.status === 'PENDING' && (
                    <>
                      <Button size="sm" onClick={() => review.mutate({ id: l.id, approve: true })}>Onayla</Button>
                      <Button size="sm" variant="danger" onClick={() => review.mutate({ id: l.id, approve: false })}>Reddet</Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="İzin talebi yok" description="Bekleyen izin talebi bulunmuyor." icon={<Calendar className="h-6 w-6" />} />
        )}
      </Card>
    </div>
  );
}
