import { supabase } from '@/lib/supabaseClient';
import { Capacitor } from '@capacitor/core';

export function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export async function subscribeToPushNotifications() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('You must be signed in to subscribe.');

    // --- CASE 1: NATIVE PLATFORM (CAPACITOR) ---
    if (Capacitor.isNativePlatform()) {
        try {
            // Import dynamically only if needed to avoid SSR or web-only issues
            const { PushNotifications } = await import('@capacitor/push-notifications');

            // 1. Request Permission
            const permStatus = await PushNotifications.requestPermissions();
            if (permStatus.receive !== 'granted') {
                throw new Error('Push notification permission denied on the device.');
            }

            // 2. Register for push (this generates the device token)
            const token = await new Promise<string>((resolve, reject) => {
                let resolved = false;
                PushNotifications.addListener('registration', (token) => {
                    if (resolved) return;
                    resolved = true;
                    resolve(token.value);
                });
                PushNotifications.addListener('registrationError', (err) => {
                    if (resolved) return;
                    resolved = true;
                    reject(err);
                });
                PushNotifications.register();
            });

            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) throw new Error('No auth session for push registration');

            const res = await fetch('/api/push/native-subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ token })
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to save native push token');
            }

            return true;

        } catch (err: any) {
            console.error('[CapacitorPush] Sub error:', err);
            throw new Error('Device push subscription failed: ' + err.message);
        }
    }

    // --- CASE 2: WEB BROWSER ---
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        throw new Error('Push notifications are not supported by this browser.');
    }

    await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
    });

    const register = await navigator.serviceWorker.ready;

    const subscription = await register.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!)
    });

    const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            subscription,
            userId: user.id
        })
    });

    if (!res.ok) {
        throw new Error('Failed to save push subscription to the server.');
    }

    return true;
}
