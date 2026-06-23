import { usePage } from '@inertiajs/react';
import { Bell, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/use-push-notifications';

const SNOOZE_KEY = 'push-prompt-snoozed-until';
const SNOOZE_DAYS = 7;

// Role-aware copy so the nudge speaks to what each user actually gets alerts for.
const ROLE_MESSAGE: Record<string, string> = {
    admin: 'Get instant alerts for new tutor requests and applications.',
    guardian: 'Get instant alerts when tutors apply to your tuition posts.',
    tutor: 'Get instant alerts for new tuition jobs and application updates.',
};

function isSnoozed(): boolean {
    if (typeof window === 'undefined') {
        return false;
    }

    const until = Number(window.localStorage.getItem(SNOOZE_KEY) ?? 0);

    return Number.isFinite(until) && until > Date.now();
}

export function PushPrompt() {
    const { supported, permission, isSubscribed, loading, enable } =
        usePushNotifications();
    const { url, props } = usePage();
    const role = props.auth.user.role;

    const [dismissed, setDismissed] = useState(isSnoozed);

    // Defer browser-only rendering until after hydration. On the SSR server
    // none of the push APIs exist, so the first client render must also produce
    // nothing — otherwise React reports a hydration mismatch.
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    // Only nudge users who can subscribe but haven't decided yet. The hook's
    // `supported` already accounts for secure context, browser support and a
    // configured VAPID key, so this stays hidden on HTTP / unsupported setups.
    const shouldShow =
        mounted &&
        supported &&
        permission === 'default' &&
        !isSubscribed &&
        !dismissed &&
        !url.startsWith('/settings/notifications');

    if (!shouldShow) {
        return null;
    }

    const handleEnable = async () => {
        const ok = await enable();

        if (ok) {
            toast.success('Push notifications enabled.');
        } else {
            toast.error('Could not enable notifications. Please try again.');
        }
    };

    const handleSnooze = () => {
        window.localStorage.setItem(
            SNOOZE_KEY,
            String(Date.now() + SNOOZE_DAYS * 24 * 60 * 60 * 1000),
        );
        setDismissed(true);
    };

    const message =
        ROLE_MESSAGE[role] ??
        'Get instant alerts — even when the app is closed.';

    return (
        <div className="relative mx-4 mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 overflow-hidden rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2.5 text-white shadow-md ring-1 ring-orange-700/30">
            <span className="relative flex size-7 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/30">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-white/20" />
                <Bell className="relative size-4" />
            </span>

            <p className="min-w-0 flex-1 text-sm">
                <span className="font-semibold">Never miss an update.</span>{' '}
                <span className="text-amber-50/90">{message}</span>
            </p>

            <div className="flex shrink-0 items-center gap-1.5">
                <Button
                    size="sm"
                    onClick={handleEnable}
                    disabled={loading}
                    className="h-8 bg-white font-semibold text-orange-700 shadow-sm hover:bg-amber-50"
                >
                    Enable
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSnooze}
                    disabled={loading}
                    className="h-8 text-amber-50 hover:bg-white/15 hover:text-white"
                >
                    Not now
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-amber-50 hover:bg-white/15 hover:text-white"
                    aria-label="Dismiss"
                    onClick={handleSnooze}
                    disabled={loading}
                >
                    <X className="size-4" />
                </Button>
            </div>
        </div>
    );
}
