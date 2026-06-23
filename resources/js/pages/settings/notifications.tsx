import { Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { edit } from '@/routes/notifications';

export default function Notifications() {
    const { supported, permission, isSubscribed, loading, enable, disable } =
        usePushNotifications();

    const handleToggle = (checked: boolean) => {
        if (checked) {
            void enable();
        } else {
            void disable();
        }
    };

    const isApple =
        typeof navigator !== 'undefined' &&
        /iPad|iPhone|iPod/.test(navigator.userAgent);

    const insecureContext =
        typeof window !== 'undefined' && !window.isSecureContext;

    return (
        <>
            <Head title="Notification settings" />

            <h1 className="sr-only">Notification settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Push notifications"
                    description="Receive emergency alerts in your browser, even when this app is closed."
                />

                {!supported ? (
                    <p className="text-sm text-muted-foreground">
                        {insecureContext
                            ? 'Push notifications require a secure connection. Open this site over HTTPS (or via localhost) to enable them.'
                            : 'Push notifications are not supported in this browser.'}
                        {isApple &&
                            ' On iPhone or iPad, add this site to your Home Screen first, then open it from there to enable notifications.'}
                    </p>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label htmlFor="push-toggle">
                                    Enable push notifications
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Get notified about important events on this
                                    device.
                                </p>
                            </div>
                            <Switch
                                id="push-toggle"
                                checked={isSubscribed}
                                disabled={loading || permission === 'denied'}
                                onCheckedChange={handleToggle}
                            />
                        </div>

                        {permission === 'denied' && (
                            <p className="text-sm text-destructive">
                                Notifications are blocked. Please allow
                                notifications for this site in your browser
                                settings, then reload this page.
                            </p>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}

Notifications.layout = {
    breadcrumbs: [
        {
            title: 'Notification settings',
            href: edit(),
        },
    ],
};
