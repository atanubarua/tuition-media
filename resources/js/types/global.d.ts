import type { Auth } from '@/types/auth';

type SharedNotification = {
    id: number;
    title: string;
    message: string;
    link: string | null;
    read_at: string | null;
    created_at: string;
};

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            sidebarOpen: boolean;
            unread_notifications_count: number;
            latest_notifications: SharedNotification[];
            [key: string]: unknown;
        };
    }
}
