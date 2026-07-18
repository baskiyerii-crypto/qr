/* Push handlers for vite-plugin-pwa Workbox SW (imported via importScripts). */
/* global self, clients */

self.addEventListener('push', (event) => {
  let payload = { title: 'QR Personel', body: '', data: {} };
  try {
    if (event.data) {
      const json = event.data.json();
      payload = {
        title: json.title || 'QR Personel',
        body: json.body || '',
        data: json.data || {},
      };
    }
  } catch {
    try {
      payload.body = event.data ? event.data.text() : '';
    } catch {
      /* ignore */
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icons/icon-192.svg',
      badge: '/icons/icon-192.svg',
      data: payload.data,
      tag: payload.data?.type || 'qr-personel',
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  let path = '/notifications';
  if (data.type === 'ATTENDANCE_OFF_BRANCH' || data.type === 'ATTENDANCE_REVIEW') {
    path = '/attendance-approvals';
  } else if (data.type === 'TASK') {
    path = '/tasks';
  } else if (data.type === 'ANNOUNCEMENT') {
    path = '/announcements';
  } else if (data.type === 'MESSAGE') {
    path = '/messages';
  } else if (typeof data.url === 'string') {
    path = data.url;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) client.navigate(path);
          return;
        }
      }
      if (clients.openWindow) return clients.openWindow(path);
    }),
  );
});
