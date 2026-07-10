import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/StatCard';
import { Bell } from 'lucide-react';

type Notification = {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

export function NotificationsPage() {
  const qc = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get<Notification[]>('/notifications'),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.post(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Bildirimler" description="Sistem ve etkinlik bildirimleriniz" icon={<Bell className="h-5 w-5" />} />
      <Card padded={false}>
        {isLoading ? (
          <div className="space-y-2 p-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
        ) : notifications && notifications.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`flex cursor-pointer items-start justify-between gap-4 px-6 py-4 transition-colors hover:bg-slate-50 ${!n.isRead ? 'bg-muted/50' : ''}`}
                onClick={() => !n.isRead && markRead.mutate(n.id)}
              >
                <div className="flex items-start gap-3">
                  {!n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  <div>
                    <p className="font-medium text-slate-900">{n.title}</p>
                    <p className="text-sm text-slate-500">{n.body}</p>
                    <p className="mt-1 text-xs text-slate-400">{new Date(n.createdAt).toLocaleString('tr-TR')}</p>
                  </div>
                </div>
                <Badge>{n.type}</Badge>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Bildirim yok" description="Henüz bildiriminiz bulunmuyor." icon={<Bell className="h-6 w-6" />} />
        )}
      </Card>
    </div>
  );
}
