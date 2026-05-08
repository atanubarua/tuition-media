import { Link, usePage } from '@inertiajs/react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toUrl } from '@/lib/utils';

type NotificationItem = {
    id: number;
    title: string;
    message: string;
    link: string | null;
    read_at: string | null;
    created_at: string;
};

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
                            {unread_notifications_count > 9
                                ? '9+'
                                : unread_notifications_count}
                        </span>
                    )}
                    <span className="sr-only">Notifications</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {latest_notifications.length === 0 ? (
                    <div className="px-2 py-3 text-sm text-muted-foreground">
                        No notifications yet.
                    </div>
                ) : (
                    latest_notifications.map((notification) => (
                        <DropdownMenuItem key={notification.id} asChild>
                            {notification.link ? (
                                <a
                                    href={toUrl(notification.link)}
                                    className="block cursor-pointer py-2"
                                >
                                    <p className="text-sm font-medium leading-tight">
                                        {notification.title}
                                    </p>
                                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                        {notification.message}
                                    </p>
                                </a>
                            ) : (
                                <div className="block py-2">
                                    <p className="text-sm font-medium leading-tight">
                                        {notification.title}
                                    </p>
                                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                        {notification.message}
                                    </p>
                                </div>
                            )}
                        </DropdownMenuItem>
                    ))
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link
                        href="/notifications"
                        className="w-full cursor-pointer justify-center text-sm font-medium"
                    >
                        See all notifications
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
