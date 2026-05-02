import { Link, usePage } from '@inertiajs/react';
import { Bell, BookOpen, FolderGit2, LayoutGrid, UserCircle } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: FolderGit2,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    const { auth, unread_notifications_count } = usePage().props as {
        auth: { user: { role: string } | null };
        unread_notifications_count: number;
    };

    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: dashboard.url(),
            icon: LayoutGrid,
        },
        ...(auth.user
            ? [
                  {
                      title: unread_notifications_count > 0
                          ? `Notifications (${unread_notifications_count})`
                          : 'Notifications',
                      href: '/notifications',
                      icon: Bell,
                  } satisfies NavItem,
              ]
            : []),
        ...(auth.user?.role === 'guardian'
            ? [
                  {
                      title: 'My Tuition Posts',
                      href: '/guardian/tuition-posts',
                      icon: BookOpen,
                  } satisfies NavItem,
              ]
            : []),
        ...(auth.user?.role === 'tutor'
            ? [
                  {
                      title: 'My Profile',
                      href: '/tutor/profile/edit',
                      icon: UserCircle,
                  } satisfies NavItem,
                  {
                      title: 'My Applications',
                      href: '/tutor/applications',
                      icon: BookOpen,
                  } satisfies NavItem,
              ]
            : []),
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard.url()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
