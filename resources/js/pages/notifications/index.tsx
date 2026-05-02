import { Head, router } from '@inertiajs/react';
import { useEffect } from 'react';
import { dashboard } from '@/routes';

type Notification = {
    id: number;
    type: string;
    title: string;
    message: string;
    link: string | null;
    read_at: string | null;
    created_at: string;
};

export default function NotificationsIndex({ notifications }: { notifications: Notification[] }) {
    useEffect(() => {
        router.post('/notifications/mark-read', {}, { preserveState: true, preserveScroll: true });
    }, []);

    return (
        <>
            <Head title="Notifications" />
            <div className="p-4 md:p-6 space-y-4 max-w-2xl">
                <h1 className="text-2xl font-semibold">Notifications</h1>

                {notifications.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No notifications yet.</p>
                ) : (
                    <div className="space-y-2">
                        {notifications.map((n) => (
                            <div
                                key={n.id}
                                className={`rounded-lg border p-4 ${n.read_at ? 'bg-card' : 'bg-blue-50 border-blue-200'}`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="font-medium text-sm">{n.title}</p>
                                        <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                                    </div>
                                    <span className="text-xs text-muted-foreground shrink-0">
                                        {new Date(n.created_at).toLocaleDateString('en-BD', {
                                            month: 'short',
                                            day: 'numeric',
                                        })}
                                    </span>
                                </div>
                                {n.link && (
                                    <a href={n.link} className="mt-2 inline-block text-xs text-blue-600 hover:underline">
                                        View →
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

NotificationsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Notifications', href: '/notifications' },
    ],
};
