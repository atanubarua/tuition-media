import { usePage } from '@inertiajs/react';
import { ChevronsUpDown } from 'lucide-react';
import { UserInfo } from '@/components/user-info';
import { UserMenuContent } from '@/components/user-menu-content';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { User } from '@/types';

export function HeaderUserMenu() {
    const { auth } = usePage().props as { auth: { user: User | null } };

    if (!auth.user) {
        return null;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="h-10 min-w-0 gap-2 rounded-full px-2"
                >
                    <div className="flex min-w-0 items-center gap-2">
                        <UserInfo user={auth.user} />
                    </div>
                    <ChevronsUpDown className="size-4 opacity-70" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
                <UserMenuContent user={auth.user} />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
