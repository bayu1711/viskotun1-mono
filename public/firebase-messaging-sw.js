/* eslint-disable no-undef */
// Zero-dependency Web Push / FCM Service Worker for TrialN1 daily adherence nudges.

self.addEventListener('push', function (event) {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { notification: { title: 'TrialN1 Reminder', body: event.data ? event.data.text() : '' } };
  }

  const notif = payload.notification || {};
  const data = payload.data || {};
  const title = notif.title || 'TrialN1 · Daily Routine';
  const options = {
    body: notif.body || 'Your adaptive routine window is ready.',
    icon: '/icon.png',
    badge: '/icon.png',
    data: {
      url: data.url || '/routine'
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const targetUrl = (event.notification && event.notification.data && event.notification.data.url) || '/routine';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
