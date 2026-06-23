// Service worker for Web Push notifications.
// Receives push messages and shows notifications even when the app is closed.

self.addEventListener('push', (event) => {
    let payload = {};

    try {
        payload = event.data ? event.data.json() : {};
    } catch (e) {
        payload = { title: 'Notification', body: event.data ? event.data.text() : '' };
    }

    const title = payload.title || 'Tuition Media';
    const options = {
        body: payload.body || '',
        icon: '/favicon.svg?v=2',
        badge: '/favicon.svg?v=2',
        tag: payload.tag || undefined,
        data: { url: payload.url || '/' },
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const targetUrl = (event.notification.data && event.notification.data.url) || '/';

    event.waitUntil(
        clients
            .matchAll({ type: 'window', includeUncontrolled: true })
            .then((windowClients) => {
                // Focus an existing tab on the same origin if one is open.
                for (const client of windowClients) {
                    const clientUrl = new URL(client.url);
                    if (clientUrl.origin === self.location.origin && 'focus' in client) {
                        client.navigate(targetUrl);
                        return client.focus();
                    }
                }

                if (clients.openWindow) {
                    return clients.openWindow(targetUrl);
                }
            }),
    );
});
