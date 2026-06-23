import { usePage } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';

import PushSubscriptionController from '@/actions/App/Http/Controllers/PushSubscriptionController';

type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const buffer = new ArrayBuffer(rawData.length);
    const outputArray = new Uint8Array(buffer);

    for (let i = 0; i < rawData.length; i += 1) {
        outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
}

function getXsrfToken(): string {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);

    return match ? decodeURIComponent(match[1]) : '';
}

async function send(
    action: { url: string; method: string },
    body: unknown,
): Promise<Response> {
    return fetch(action.url, {
        method: action.method.toUpperCase(),
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-XSRF-TOKEN': getXsrfToken(),
        },
        credentials: 'same-origin',
        body: JSON.stringify(body),
    });
}

const isSupported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window;

export function usePushNotifications() {
    const { vapid_public_key: vapidPublicKey } = usePage().props;

    const [permission, setPermission] = useState<PermissionState>(
        isSupported ? Notification.permission : 'unsupported',
    );
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);

    // Reflect the current subscription state on mount.
    useEffect(() => {
        if (!isSupported) {
            return;
        }

        navigator.serviceWorker.ready
            .then((registration) => registration.pushManager.getSubscription())
            .then((subscription) => setIsSubscribed(subscription !== null))
            .catch(() => setIsSubscribed(false));
    }, []);

    const enable = useCallback(async (): Promise<boolean> => {
        if (!isSupported || !vapidPublicKey) {
            return false;
        }

        setLoading(true);

        try {
            const result = await Notification.requestPermission();
            setPermission(result);

            if (result !== 'granted') {
                return false;
            }

            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
            });

            const json = subscription.toJSON();
            await send(PushSubscriptionController.store(), {
                endpoint: subscription.endpoint,
                keys: json.keys,
                contentEncoding:
                    (
                        PushManager as unknown as {
                            supportedContentEncodings?: string[];
                        }
                    ).supportedContentEncodings?.[0] ?? 'aesgcm',
            });

            setIsSubscribed(true);

            return true;
        } catch {
            return false;
        } finally {
            setLoading(false);
        }
    }, [vapidPublicKey]);

    const disable = useCallback(async (): Promise<void> => {
        if (!isSupported) {
            return;
        }

        setLoading(true);

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription =
                await registration.pushManager.getSubscription();

            if (subscription) {
                await send(PushSubscriptionController.destroy(), {
                    endpoint: subscription.endpoint,
                });
                await subscription.unsubscribe();
            }

            setIsSubscribed(false);
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        supported: isSupported && Boolean(vapidPublicKey),
        permission,
        isSubscribed,
        loading,
        enable,
        disable,
    };
}
