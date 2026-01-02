// Service Worker for Push Notifications
// This handles incoming push notifications and notification clicks

self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(clients.claim());
});

// Handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);

  if (!event.data) {
    console.log('Push event but no data');
    return;
  }

  let data;
  try {
    data = event.data.json();
  } catch (error) {
    console.error('Error parsing push data:', error);
    data = {
      title: 'New Milestone Nudge',
      body: 'You have a new milestone reminder',
      icon: '/icon-192x192.png'
    };
  }

  const options = {
    body: data.body || 'You have a new milestone reminder',
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/badge-72x72.png',
    vibrate: data.vibrate || [200, 100, 200],
    tag: data.tag || 'milestone-nudge',
    requireInteraction: false,
    data: {
      url: data.url || data.data?.url || '/',
      notificationId: data.notificationId || data.data?.notificationId
    },
    actions: data.actions || [
      {
        action: 'view',
        title: 'View Now'
      },
      {
        action: 'close',
        title: 'Dismiss'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || '🎯 New Milestone Nudge', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  if (event.action === 'close') {
    // User dismissed the notification
    return;
  }

  // Open the URL from the notification data
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }

        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Handle notification close (for analytics if needed later)
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event.notification.tag);
});
