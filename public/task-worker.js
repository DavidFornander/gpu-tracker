self.addEventListener('install', () => {
  self.skipWaiting();
  console.log('Task Service Worker installed');
});

self.addEventListener('activate', (event) => {
  console.log('Task Service Worker activated');
  event.waitUntil(self.clients.claim());
});

// Handle periodic task check messages
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CHECK_TASKS') {
    // Post message back to client to check tasks
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'RUN_TASK_CHECK'
        });
      });
    });
  }
});

// Set up periodic wake-ups (every 5 minutes)
const INTERVAL = 5 * 60 * 1000;
setInterval(() => {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'RUN_TASK_CHECK'
      });
    });
  });
}, INTERVAL);
