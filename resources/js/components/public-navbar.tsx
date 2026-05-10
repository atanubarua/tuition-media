import { Link, router, usePage } from '@inertiajs/react';
import { login, logout, register } from '@/routes';
import { useFlashToast } from '@/hooks/use-flash-toast';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BookOpen, ChevronDown, LayoutDashboard, LogOut, User } from 'lucide-react';

type PublicNavbarProps = {
    canRegister?: boolean;
    active?: 'find-tutors' | 'tuition-jobs' | null;
    position?: 'fixed' | 'sticky';
    maxWidthClass?: string;
};

export default function PublicNavbar({
    canRegister = true,
    active = null,
    position = 'sticky',
    maxWidthClass = 'max-w-7xl',
}: PublicNavbarProps) {
    const { auth, unread_notifications_count, locale, translations } = usePage().props as any;
    useFlashToast();
    const isFixed = position === 'fixed';
    const nav = translations?.nav ?? {};

    const switchLanguage = (target: 'en' | 'bn') => {
        router.post('/lang', { locale: target }, { preserveScroll: true });
    };

    return (
        <nav className={`${isFixed ? 'fixed top-0 left-0 right-0' : 'sticky top-0'} z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md transition-all`}>
            <div className={`mx-auto flex ${maxWidthClass} items-center justify-between px-4 py-4 lg:px-8`}>
                <div className="flex items-center gap-10">
                    <Link href="/" className="flex items-center gap-2 text-2xl font-bold tracking-tight text-blue-900">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                            <BookOpen className="h-5 w-5" />
                        </div>
                        Tuition<span className="text-amber-500">Media</span>
                    </Link>

                    <div className="hidden md:flex items-center gap-6">
                        <Link
                            href="/find-tutors"
                            className={`text-sm font-semibold transition ${active === 'find-tutors' ? 'text-blue-700 font-bold' : 'text-slate-600 hover:text-blue-600'}`}
                        >
                            {nav.find_tutors ?? 'Find Tutors'}
                        </Link>
                        <Link
                            href="/tuition-jobs"
                            className={`text-sm font-semibold transition ${active === 'tuition-jobs' ? 'text-blue-700 font-bold' : 'text-slate-600 hover:text-blue-600'}`}
                        >
                            {nav.tuition_jobs ?? 'Tuition Jobs'}
                        </Link>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                        <button
                            type="button"
                            onClick={() => switchLanguage('en')}
                            className={`rounded-md px-2.5 py-1 text-xs font-semibold ${locale === 'en' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'}`}
                        >
                            EN
                        </button>
                        <button
                            type="button"
                            onClick={() => switchLanguage('bn')}
                            className={`rounded-md px-2.5 py-1 text-xs font-semibold ${locale === 'bn' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'}`}
                        >
                            বাংলা
                        </button>
                    </div>

                    {auth.user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    aria-label="Open user menu"
                                    className="inline-flex h-10 items-center gap-1.5 rounded-full border border-blue-300 bg-white px-2.5 text-blue-700 shadow-sm transition hover:border-blue-400 hover:bg-blue-50"
                                >
                                    <User className="h-4 w-4" />
                                    <span className="hidden max-w-28 truncate text-sm font-semibold sm:inline">
                                        {auth.user.name}
                                    </span>
                                    {unread_notifications_count > 0 && (
                                        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                                            {unread_notifications_count > 99 ? '99+' : unread_notifications_count}
                                        </span>
                                    )}
                                    <ChevronDown className="h-4 w-4" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem asChild>
                                    <Link href="/dashboard" className="w-full cursor-pointer">
                                        <LayoutDashboard className="h-4 w-4" />
                                        <span>{nav.dashboard ?? 'Dashboard'}</span>
                                        {unread_notifications_count > 0 && (
                                            <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                                                {unread_notifications_count > 99 ? '99+' : unread_notifications_count}
                                            </span>
                                        )}
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href={logout()} as="button" className="w-full cursor-pointer">
                                        <LogOut className="h-4 w-4" />
                                        {nav.log_out ?? 'Log out'}
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <>
                            <Link
                                href={login()}
                                className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                            >
                                {nav.log_in ?? 'Log in'}
                            </Link>
                            {canRegister && (
                                <Link
                                    href={register()}
                                    className="hidden sm:inline-flex items-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                                >
                                    {nav.register ?? 'Register'}
                                </Link>
                            )}
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
