self.addEventListener('push', function(event) {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'Notion';
    const options = {
        body: data.body || 'Time is out! Deaedline has already come.',
        icon: '/icon.png',
        badge: '/badge.png'
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/')
    );
});