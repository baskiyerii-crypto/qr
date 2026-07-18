import { api } from './api';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export type PermissionState = NotificationPermission | 'unsupported';

export function getNotificationPermission(): PermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export async function getServiceWorkerRegistration() {
  if (!('serviceWorker' in navigator)) return null;
  return navigator.serviceWorker.ready;
}

export async function fetchVapidPublicKey() {
  const data = await api.get<{ publicKey: string | null }>('/notifications/vapid-public-key');
  return data.publicKey;
}

export async function enableWebPush() {
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Bu tarayıcı bildirimleri desteklemiyor');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Bildirim izni verilmedi');
  }

  const publicKey = await fetchVapidPublicKey();
  if (!publicKey) {
    throw new Error('Sunucu VAPID anahtarı yapılandırılmamış');
  }

  const reg = await getServiceWorkerRegistration();
  if (!reg) throw new Error('Service worker hazır değil');

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  const json = sub.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    throw new Error('Abonelik oluşturulamadı');
  }

  await api.post('/notifications/register-device', {
    webPushSubscription: {
      endpoint: json.endpoint,
      expirationTime: json.expirationTime ?? null,
      keys: {
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
      },
    },
  });

  return true;
}

export async function disableWebPush() {
  const reg = await getServiceWorkerRegistration();
  if (reg) {
    const sub = await reg.pushManager.getSubscription();
    if (sub) await sub.unsubscribe();
  }
  await api.post('/notifications/register-device', {
    webPushSubscription: null,
  });
  return true;
}

export async function hasActiveWebPushSubscription() {
  const reg = await getServiceWorkerRegistration();
  if (!reg) return false;
  const sub = await reg.pushManager.getSubscription();
  return !!sub;
}
