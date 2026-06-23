import { Link, usePage } from '@inertiajs/react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type NotificationItem = {
    id: number;
    title: string;
    message: string;
    link: string | null;
    read_at: string | null;
    created_at: string;
};

function timeAgo(dateStr: string): string {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

export function NotificationsMenu() {
    const { unread_notifications_count, latest_notifications } = usePage()
        .props as {
        unread_notifications_count: number;
        latest_notifications: NotificationItem[];
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9">
                    <Bell className="size-5" />
                    {unread_notifications_count > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] leading-4 font-semibold text-white">
                            {unread_notifications_count > 9 ? '9+' : unread_notifications_count}
                        </span>
                    )}
                    <span className="sr-only">Notifications</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-96 p-0 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
                    {unread_notifications_count > 0 && (
                        <span className="text-xs font-medium text-white bg-red-500 rounded-full px-2 py-0.5">
                            {unread_notifications_count} new
                        </span>
                    )}
                </div>

                {/* Items */}
                <div className="max-h-[360px] overflow-y-auto divide-y divide-border">
                    {latest_notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                            <Bell className="h-8 w-8 text-muted-foreground/40 mb-2" />
                            <p className="text-sm font-medium text-muted-foreground">No notifications yet</p>
                            <p className="text-xs text-muted-foreground/60 mt-1">You're all caught up!</p>
                        </div>
                    ) : (
                        latest_notifications.map((n) => {
                            const isUnread = !n.read_at;
                            const inner = (
                                <div className={`flex gap-3 px-4 py-3 transition-colors hover:bg-muted/50 ${isUnread ? 'bg-blue-50/60 dark:bg-blue-950/20' : ''}`}>
                                    <div className="mt-1 flex-shrink-0">
                                        <span className={`inline-block h-2 w-2 rounded-full ${isUnread ? 'bg-blue-500' : 'bg-transparent border border-muted-foreground/30'}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm leading-snug ${isUnread ? 'font-semibold text-foreground' : 'font-medium text-foreground/80'}`}>
                                            {n.title}
                                        </p>
                                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                            {n.message}
                                        </p>
                                        <p className="mt-1 text-[11px] text-muted-foreground/60">
                                            {timeAgo(n.created_at)}
                                        </p>
                                    </div>
                                </div>
                            );

                            return n.link ? (
                                <a key={n.id} href={`/notifications/${n.id}/read`} className="block cursor-pointer">
                                    {inner}
                                </a>
                            ) : (
                                <div key={n.id}>{inner}</div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-border px-4 py-2.5">
                    <Link
                        href="/notifications"
                        className="block text-center text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                    >
                        See all notifications
                    </Link>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
