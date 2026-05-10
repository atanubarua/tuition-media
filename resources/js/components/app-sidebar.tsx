import { Link, usePage } from '@inertiajs/react';
import { BookOpen, HandCoins, LayoutGrid, Users, UserCircle } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

export function AppSidebar() {
    const { auth } = usePage().props as {
        auth: { user: { role: string } | null };
    };

    const dashboardHref = dashboard.url();

    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: dashboardHref,
            icon: LayoutGrid,
        },
        ...(auth.user?.role === 'guardian'
            ? [
                  {
                      title: 'My Tuition Posts',
                      href: '/guardian/tuition-posts',
                      icon: BookOpen,
                  } satisfies NavItem,
              ]
            : []),
         ...(auth.user?.role === 'admin'
             ? [
                   {
                       title: 'Tuition Posts',
                       href: '/admin/tuition-posts',
                       icon: BookOpen,
                   } satisfies NavItem,
                   {
                       title: 'Tutors',
                       href: '/admin/tutors',
                       icon: Users,
                   } satisfies NavItem,
                   {
                       title: 'Guardians',
                       href: '/admin/guardians',
                       icon: Users,
                   } satisfies NavItem,
                   {
                       title: 'Applications',
                       href: '/admin/applications',
                       icon: UserCircle,
                   } satisfies NavItem,
                   {
                       title: 'Commissions',
                       href: '/admin/commissions',
                       icon: HandCoins,
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
                            <Link href={dashboardHref}>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>
        </Sidebar>
    );
}
