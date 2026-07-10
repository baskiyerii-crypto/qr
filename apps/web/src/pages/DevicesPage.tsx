import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/StatCard';
import { Smartphone, Check, X } from 'lucide-react';

type PendingDevice = {
  id: string;
  deviceId: string;
  deviceName: string | null;
  employee: { user: { firstName: string; lastName: string; email: string } };
};

export function DevicesPage() {
  const qc = useQueryClient();
  const { data: devices, isLoading, isError } = useQuery({
    queryKey: ['devices-pending'],
    queryFn: () => api.get<PendingDevice[]>('/devices/pending'),
  });

  const review = useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) =>
      api.post(`/devices/${id}/review`, { approve }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['devices-pending'] }),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Cihaz Onayları" description="Personel cihaz bağlama talepleri" icon={<Smartphone className="h-5 w-5" />} />

      {isError && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">Cihaz listesi yüklenemedi</p>}
      {isLoading && <div className="grid gap-4">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>}
      {!isLoading && !devices?.length && (
        <Card><EmptyState title="Bekleyen cihaz onayı yok" description="Tüm cihaz talepleri işlendi." icon={<Smartphone className="h-6 w-6" />} /></Card>
      )}

      <div className="grid gap-4">
        {devices?.map((d) => (
          <Card key={d.id} hover>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-primary">
                  <Smartphone className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">
                    {d.employee.user.firstName} {d.employee.user.lastName}
                  </p>
                  <p className="text-sm text-slate-500">{d.employee.user.email}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {d.deviceName || d.deviceId}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => review.mutate({ id: d.id, approve: true })} disabled={review.isPending}>
                  <Check className="h-4 w-4" /> Onayla
                </Button>
                <Button size="sm" variant="secondary" onClick={() => review.mutate({ id: d.id, approve: false })} disabled={review.isPending}>
                  <X className="h-4 w-4" /> Reddet
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
