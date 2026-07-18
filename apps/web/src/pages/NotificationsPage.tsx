import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/StatCard';
import { Tabs } from '@/components/ui/Tabs';
import {
  enableWebPush,
  disableWebPush,
  getNotificationPermission,
  hasActiveWebPushSubscription,
} from '@/lib/web-push';
import { usePwaInstall } from '@/components/InstallAppBanner';
import { Bell, BellOff, Download, Share, Smartphone } from 'lucide-react';

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
  const [tab, setTab] = useState('inbox');
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMsg, setPushMsg] = useState('');
  const [iosSteps, setIosSteps] = useState(false);
  const { canInstall, iosHint, installed, promptInstall } = usePwaInstall();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get<Notification[]>('/notifications'),
  });

  const { data: pushStatus, refetch: refetchPush } = useQuery({
    queryKey: ['web-push-status'],
    queryFn: async () => {
      const permission = getNotificationPermission();
      const subscribed = permission === 'granted' ? await hasActiveWebPushSubscription() : false;
      return { permission, subscribed };
    },
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.post(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unread = notifications?.filter((n) => !n.isRead).length ?? 0;

  const onEnablePush = async () => {
    setPushBusy(true);
    setPushMsg('');
    try {
      await enableWebPush();
      setPushMsg('Tarayıcı bildirimleri açıldı');
      await refetchPush();
    } catch (e) {
      setPushMsg(e instanceof Error ? e.message : 'Bildirim açılamadı');
    } finally {
      setPushBusy(false);
    }
  };

  const onDisablePush = async () => {
    setPushBusy(true);
    setPushMsg('');
    try {
      await disableWebPush();
      setPushMsg('Tarayıcı bildirimleri kapatıldı');
      await refetchPush();
    } catch (e) {
      setPushMsg(e instanceof Error ? e.message : 'Bildirim kapatılamadı');
    } finally {
      setPushBusy(false);
    }
  };

  const onInstall = async () => {
    const result = await promptInstall();
    if (result === 'ios') setIosSteps(true);
  };

  const permissionLabel =
    pushStatus?.permission === 'granted'
      ? 'Açık'
      : pushStatus?.permission === 'denied'
        ? 'Reddedildi'
        : pushStatus?.permission === 'unsupported'
          ? 'Desteklenmiyor'
          : 'Kapalı';

  return (
    <div className="space-y-6">
      <PageHeader title="Bildirimler" description="Sistem ve etkinlik bildirimleriniz" icon={<Bell className="h-5 w-5" />} />

      <Tabs
        tabs={[
          { id: 'inbox', label: 'Gelen kutusu', count: unread || undefined },
          { id: 'settings', label: 'Bildirim ayarları' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'inbox' && (
        <Card padded={false}>
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-14 rounded-xl" />
              ))}
            </div>
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
                      <p className="mt-1 text-xs text-slate-400">
                        {new Date(n.createdAt).toLocaleString('tr-TR')}
                      </p>
                    </div>
                  </div>
                  <Badge>{n.type}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Bildirim yok"
              description="Henüz bildiriminiz bulunmuyor."
              icon={<Bell className="h-6 w-6" />}
            />
          )}
        </Card>
      )}

      {tab === 'settings' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-4 w-4" /> Tarayıcı bildirimleri
              </CardTitle>
            </CardHeader>
            <p className="mb-4 text-sm text-slate-500">
              Duyuru, görev ve devam uyarılarını tarayıcı / masaüstü bildirimi olarak alın.
              Redis kapalı ortamlarda yalnızca uygulama içi kutuya yazılır.
            </p>
            <dl className="mb-4 space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">İzin durumu</dt>
                <dd>
                  <Badge
                    variant={
                      pushStatus?.permission === 'granted'
                        ? 'success'
                        : pushStatus?.permission === 'denied'
                          ? 'error'
                          : 'default'
                    }
                  >
                    {permissionLabel}
                  </Badge>
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Abonelik</dt>
                <dd className="font-medium text-slate-900">
                  {pushStatus?.subscribed ? 'Aktif' : 'Yok'}
                </dd>
              </div>
            </dl>
            <div className="flex flex-wrap gap-2">
              {pushStatus?.subscribed ? (
                <Button variant="secondary" onClick={onDisablePush} disabled={pushBusy}>
                  <BellOff className="mr-1.5 h-4 w-4" />
                  Bildirimleri kapat
                </Button>
              ) : (
                <Button onClick={onEnablePush} disabled={pushBusy || pushStatus?.permission === 'unsupported'}>
                  <Bell className="mr-1.5 h-4 w-4" />
                  Bildirimleri aç
                </Button>
              )}
            </div>
            {pushMsg ? (
              <p className="mt-3 text-sm text-slate-600">{pushMsg}</p>
            ) : null}
            {pushStatus?.permission === 'denied' ? (
              <p className="mt-3 text-sm text-amber-700">
                Tarayıcı ayarlarından bu site için bildirim iznini manuel açmanız gerekir.
              </p>
            ) : null}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" /> Masaüstüne / ana ekrana ekle
              </CardTitle>
            </CardHeader>
            <p className="mb-4 text-sm text-slate-500">
              Uygulamayı ana ekrana ekleyerek tarayıcı sekmesi olmadan kullanın. iOS’ta PWA
              kurulumu sonrası bildirimler daha güvenilir çalışır.
            </p>
            {installed ? (
              <Badge variant="success">Kurulu (standalone)</Badge>
            ) : (
              <>
                {(canInstall || iosHint) && (
                  <Button onClick={onInstall} className="mb-3">
                    <Download className="mr-1.5 h-4 w-4" />
                    Masaüstüne ekle
                  </Button>
                )}
                {!canInstall && !iosHint && (
                  <p className="text-sm text-slate-500">
                    Bu tarayıcıda otomatik kurulum önerisi yok. Chrome / Edge kullanın veya
                    menüden “Uygulamayı yükle”yi deneyin.
                  </p>
                )}
                {(iosSteps || iosHint) && (
                  <p className="mt-3 text-sm text-slate-600">
                    <Share className="inline h-3.5 w-3.5" /> Safari → Paylaş →{' '}
                    <strong>Ana Ekrana Ekle</strong>
                  </p>
                )}
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
