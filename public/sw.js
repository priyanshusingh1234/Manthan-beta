self.addEventListener('push', function (event) {
    if (event.data) {
        const data = event.data.json();
        
        const options = {
            body: data.body,
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            vibrate: [100, 50, 100],
            actions: data.actions || [],
            data: {
                dateOfArrival: Date.now(),
                url: data.url || '/'
            }
        };

        // Ensure we handle multiple notifications without overwriting
        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    let urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

    // Handle action buttons
    if (event.action) {
        if (event.action === 'decline' || event.action === 'decline_duel') {
            // If they clicked decline, we just let the notification close.
            return;
        } else if (event.action === 'reply') {
            if (urlToOpen.includes('/chat/')) {
                const separator = urlToOpen.includes('?') ? '&' : '?';
                urlToOpen += `${separator}reply=1`;
            }
        } else if (event.action === 'answer') {
            // If it's a chat/call URL, auto-accept it
            if (urlToOpen.includes('/chat/')) {
                const separator = urlToOpen.includes('?') ? '&' : '?';
                urlToOpen += `${separator}incoming=1&autoAccept=1`;
            }
        }
    }

    // This looks to see if the current window is already open and focuses if it is
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            let matchingClient = null;

            for (let i = 0; i < windowClients.length; i++) {
                const windowClient = windowClients[i];
                if (windowClient.url === urlToOpen) {
                    matchingClient = windowClient;
                    break;
                }
            }

            if (matchingClient) {
                return matchingClient.focus();
            } else {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
