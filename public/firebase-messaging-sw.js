importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyAlwZ4hr0hRyFDH339f94WNWSbIJYv6rjU',
  authDomain: 'dayschallenge-7d35e.firebaseapp.com',
  projectId: 'dayschallenge-7d35e',
  messagingSenderId: '148133867688',
  appId: '1:148133867688:web:0870ac98efba281119d29d',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification ?? {};
  const questionId = payload.data?.question_id;
  self.registration.showNotification(title ?? 'Revigion', {
    body: body ?? 'Time to revise',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: { url: questionId ? '/subjects' : '/' },
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
