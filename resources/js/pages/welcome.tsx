import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { login, register } from '@/routes';
import { toast } from 'sonner';
import {
    BookOpen,
    MapPin,
    Calendar,
    User,
    Search,
    GraduationCap,
    ArrowRight,
    Users,
    BookMarked,
    Lightbulb,
    ChevronDown,
    LayoutDashboard,
    LogOut,
    ShieldCheck,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type Subject = { id: number; name: string };
type Student = { id: number; academic_level: string; class_level: string | null; medium: string; subjects: Subject[] };
type Post = {
    id: number;
    title: string | null;
    district_name: string;
    subdistrict_name: string;
    salary_type: string;
    salary_min: number | null;
    salary_max: number | null;
    days_per_week: number;
    tutor_gender_preference: string;
    required_experience_months: number | null;
    published_at: string;
    students: Student[];
};

type WelcomeTranslations = Record<string, any>;

type WelcomeProps = {
    canRegister?: boolean;
    posts?: Post[];
    stats?: { total_posts: number; total_tutors: number };
    locale?: 'en' | 'bn';
    translations: WelcomeTranslations;
};

function str(value: unknown, fallback = ''): string {
    return typeof value === 'string' ? value : fallback;
}

function salaryLabel(post: Post, t: WelcomeTranslations, locale: 'en' | 'bn') {
    const negotiable = str(t?.card?.salary_negotiable, 'Negotiable');

    if (post.salary_type === 'negotiable') {
        return negotiable;
    }

    const formattedMin = post.salary_min ? `৳${post.salary_min.toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-US')}` : null;
    const formattedMax = post.salary_max ? `৳${post.salary_max.toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-US')}` : null;

    if (post.salary_type === 'range' && formattedMin && formattedMax) {
        return `${formattedMin} - ${formattedMax}`;
    }

    return formattedMin ?? negotiable;
}

function levelLabel(level: string, t: WelcomeTranslations) {
    return str(t?.card?.levels?.[level], level);
}

function replaceVars(template: string, vars: Record<string, string | number>) {
    return Object.entries(vars).reduce((result, [key, value]) => result.replace(`:${key}`, String(value)), template);
}

function TuitionCard({ post, t, locale }: { post: Post; t: WelcomeTranslations; locale: 'en' | 'bn' }) {
    const allSubjects = [...new Set(post.students.flatMap((s) => s.subjects.map((sub) => sub.name)))];
    const levels = [...new Set(post.students.map((s) => levelLabel(s.academic_level, t)))];

    return (
        <Link
            href={`/tuition-posts/${post.id}`}
            className="group flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-md"
        >
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <h3 className="w-full min-w-0 font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-blue-700 transition-colors">
                    {post.title || replaceVars(str(t?.card?.default_title, 'Tuition in :subdistrict'), { subdistrict: post.subdistrict_name })}
                </h3>
                <span className="max-w-full shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 break-words">
                    {salaryLabel(post, t, locale)}
                </span>
            </div>

            <div className="flex flex-wrap gap-2">
                {allSubjects.slice(0, 3).map((s) => (
                    <span key={s} className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 border border-blue-100/50">
                        {s}
                    </span>
                ))}
                {allSubjects.length > 3 && (
                    <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 border border-slate-200/50">
                        {replaceVars(str(t?.card?.more_count, '+:count more'), { count: allSubjects.length - 3 })}
                    </span>
                )}
            </div>

            <div className="mt-auto pt-4 border-t border-slate-100 flex flex-wrap gap-y-3 gap-x-5 text-sm text-slate-500">
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span className="min-w-0 break-words sm:truncate">{post.subdistrict_name}, {post.district_name}</span>
                </div>
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                    <GraduationCap className="h-4 w-4 text-slate-400" />
                    <span className="min-w-0 break-words sm:truncate">{levels.join(', ')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span>{replaceVars(str(t?.card?.days_per_week, ':count d/wk'), { count: post.days_per_week })}</span>
                </div>
                {post.tutor_gender_preference !== 'any' && (
                    <div className="flex items-center gap-1.5 w-full sm:w-auto">
                        <User className="h-4 w-4 text-slate-400" />
                        <span className="min-w-0 break-words capitalize">
                            {replaceVars(str(t?.card?.tutor_suffix, ':gender Tutor'), { gender: post.tutor_gender_preference })}
                        </span>
                    </div>
                )}
            </div>
        </Link>
    );
}

export default function Welcome({
    canRegister = true,
    posts = [],
    stats = { total_posts: 0, total_tutors: 0 },
    locale = 'en',
    translations,
}: WelcomeProps) {
    const { auth, unread_notifications_count } = usePage().props as any;
    const [location, setLocation] = useState('');
    const [subject, setSubject] = useState('');
    const [searchMode, setSearchMode] = useState<'tutor' | 'job'>('tutor');

    const t = translations ?? {};
    const stepsGuardians: string[] = Array.isArray(t?.how?.guardians_steps) ? t.how.guardians_steps : [];
    const stepsTutors: string[] = Array.isArray(t?.how?.tutors_steps) ? t.how.tutors_steps : [];

    const switchLanguage = (target: 'en' | 'bn') => {
        router.get('/', { lang: target }, { preserveScroll: true });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();

        if (!location.trim() && !subject.trim()) {
            toast.error(str(t?.hero?.empty_search_error, 'Please enter an Area or Subject to begin your search.'));
            return;
        }

        const url = searchMode === 'tutor' ? '/find-tutors' : '/tuition-jobs';

        router.get(
            url,
            {
                location: location.trim() || undefined,
                subject: subject.trim() || undefined,
            },
            { preserveScroll: true }
        );
    };

    return (
        <div className="min-h-screen overflow-x-hidden bg-white font-sans text-slate-900 selection:bg-blue-200 selection:text-blue-900">
            <Head title={str(t?.meta_title, 'Tuition Media - Find Tutors & Tuition Jobs in Bangladesh')} />

            <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md transition-all">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 lg:px-8">
                    <div className="flex items-center gap-10">
                        <Link href="/" className="flex items-center gap-2 text-2xl font-bold tracking-tight text-blue-900">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                                <BookOpen className="h-5 w-5" />
                            </div>
                            {str(t?.brand?.tuition, 'Tuition')}<span className="text-amber-500">{str(t?.brand?.media, 'Media')}</span>
                        </Link>

                        <div className="hidden md:flex items-center gap-6">
                            <Link href="/find-tutors" className="text-sm font-semibold text-slate-600 transition hover:text-blue-600">
                                {str(t?.nav?.find_tutors, 'Find Tutors')}
                            </Link>
                            <Link href="/tuition-jobs" className="text-sm font-semibold text-slate-600 transition hover:text-blue-600">
                                {str(t?.nav?.tuition_jobs, 'Tuition Jobs')}
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
                                {str(t?.language?.en, 'EN')}
                            </button>
                            <button
                                type="button"
                                onClick={() => switchLanguage('bn')}
                                className={`rounded-md px-2.5 py-1 text-xs font-semibold ${locale === 'bn' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'}`}
                            >
                                {str(t?.language?.bn, 'বাংলা')}
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
                                        <span className="hidden max-w-28 truncate text-sm font-semibold sm:inline">{auth.user.name}</span>
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
                                            <span>{str(t?.nav?.dashboard, 'Dashboard')}</span>
                                            {unread_notifications_count > 0 && (
                                                <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                                                    {unread_notifications_count > 99 ? '99+' : unread_notifications_count}
                                                </span>
                                            )}
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/logout" method="post" as="button" className="w-full cursor-pointer">
                                            <LogOut className="h-4 w-4" />
                                            {str(t?.nav?.log_out, 'Log out')}
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
                                    {str(t?.nav?.log_in, 'Log in')}
                                </Link>
                                {canRegister && (
                                    <Link
                                        href={register()}
                                        className="hidden sm:inline-flex items-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                                    >
                                        {str(t?.nav?.register, 'Register')}
                                    </Link>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </nav>

            <section className="relative overflow-hidden bg-slate-50 pt-32 pb-10 lg:pt-40 lg:pb-14">
                <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3">
                    <svg width="404" height="404" fill="none" viewBox="0 0 404 404" aria-hidden="true" className="text-blue-100 opacity-50"><defs><pattern id="85737c0e-0916-41d7-917f-596dc7edfa27" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse"><rect x="0" y="0" width="4" height="4" fill="currentColor"></rect></pattern></defs><rect width="404" height="404" fill="url(#85737c0e-0916-41d7-917f-596dc7edfa27)"></rect></svg>
                </div>

                <div className="absolute left-0 bottom-0 translate-y-1/3 -translate-x-1/3">
                    <svg width="404" height="404" fill="none" viewBox="0 0 404 404" aria-hidden="true" className="text-amber-100 opacity-50"><defs><pattern id="85737c0e-0916-41d7-917f-596dc7edfa28" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse"><rect x="0" y="0" width="4" height="4" fill="currentColor"></rect></pattern></defs><rect width="404" height="404" fill="url(#85737c0e-0916-41d7-917f-596dc7edfa28)"></rect></svg>
                </div>

                <div className="relative mx-auto max-w-5xl px-4 text-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-700 mb-8">
                        <GraduationCap className="h-4 w-4" />
                        <span>{str(t?.hero?.badge)}</span>
                    </div>

                    <h1 className="mb-6 text-5xl font-extrabold tracking-tight text-slate-900 md:text-7xl lg:leading-[1.1]">{str(t?.hero?.title)}</h1>
                    <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-600 md:text-xl">{str(t?.hero?.description)}</p>

                    <div className="mx-auto max-w-2xl">
                        <div className="flex justify-center mb-6">
                            <div className="inline-flex rounded-full bg-slate-200/60 p-1 backdrop-blur-sm border border-slate-300/50">
                                <button onClick={() => setSearchMode('tutor')} className={`rounded-full px-6 py-2.5 text-sm font-bold transition-all ${searchMode === 'tutor' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>{str(t?.hero?.need_tutor)}</button>
                                <button onClick={() => setSearchMode('job')} className={`rounded-full px-6 py-2.5 text-sm font-bold transition-all ${searchMode === 'job' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>{str(t?.hero?.want_teach)}</button>
                            </div>
                        </div>

                        <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-center gap-2 rounded-2xl bg-white p-3 shadow-xl shadow-blue-900/5 ring-1 ring-slate-200">
                            <div className="flex w-full items-center pl-4 pr-2 border-b md:border-b-0 md:border-r border-slate-200 py-2 md:py-0">
                                <MapPin className="h-5 w-5 text-slate-400 shrink-0" />
                                <input type="text" placeholder={str(t?.hero?.location_placeholder)} value={location} onChange={(e) => setLocation(e.target.value)} className="w-full bg-transparent px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 border-none text-base" />
                            </div>
                            <div className="flex w-full items-center pl-4 pr-2 py-2 md:py-0">
                                <BookOpen className="h-5 w-5 text-slate-400 shrink-0" />
                                <input type="text" placeholder={searchMode === 'tutor' ? str(t?.hero?.subject_placeholder_tutor) : str(t?.hero?.subject_placeholder_job)} value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full bg-transparent px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 border-none text-base" />
                            </div>
                            <button type="submit" className="w-full md:w-auto shrink-0 rounded-xl bg-blue-600 px-8 py-4 font-bold text-white transition hover:bg-blue-700 shadow-md hover:shadow-lg mt-2 md:mt-0">{searchMode === 'tutor' ? str(t?.hero?.find_tutors) : str(t?.hero?.find_tuitions)}</button>
                        </form>
                    </div>
                </div>
            </section>

            <section className="bg-white border-y border-slate-200 py-8">
                <div className="mx-auto max-w-5xl px-4">
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 text-center">
                        <div className="pt-4 sm:pt-0"><p className="text-4xl font-extrabold text-blue-700">{stats.total_posts.toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-US')}+</p><p className="mt-2 text-sm font-bold text-slate-500 uppercase tracking-wider">{str(t?.stats?.jobs)}</p></div>
                        <div className="pt-4 sm:pt-0"><p className="text-4xl font-extrabold text-blue-700">{stats.total_tutors.toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-US')}+</p><p className="mt-2 text-sm font-bold text-slate-500 uppercase tracking-wider">{str(t?.stats?.tutors)}</p></div>
                        <div className="pt-4 sm:pt-0"><p className="text-4xl font-extrabold text-blue-700">{(64).toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-US')}</p><p className="mt-2 text-sm font-bold text-slate-500 uppercase tracking-wider">{str(t?.stats?.districts)}</p></div>
                    </div>
                </div>
            </section>

            <section className="py-20 bg-slate-50">
                <div className="mx-auto max-w-6xl px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">{str(t?.features?.title)}</h2>
                        <p className="mt-4 text-slate-600 text-lg max-w-2xl mx-auto">{str(t?.features?.description)}</p>
                    </div>
                    <div className="grid gap-8 md:grid-cols-3">
                        <div className="rounded-2xl bg-white p-8 border border-slate-200 shadow-sm transition hover:-translate-y-1 hover:shadow-md"><div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600"><ShieldCheck className="h-7 w-7" /></div><h3 className="mb-3 text-xl font-bold text-slate-900">{str(t?.features?.verified_title)}</h3><p className="text-slate-600 leading-relaxed">{str(t?.features?.verified_description)}</p></div>
                        <div className="rounded-2xl bg-white p-8 border border-slate-200 shadow-sm transition hover:-translate-y-1 hover:shadow-md"><div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600"><MapPin className="h-7 w-7" /></div><h3 className="mb-3 text-xl font-bold text-slate-900">{str(t?.features?.local_title)}</h3><p className="text-slate-600 leading-relaxed">{str(t?.features?.local_description)}</p></div>
                        <div className="rounded-2xl bg-white p-8 border border-slate-200 shadow-sm transition hover:-translate-y-1 hover:shadow-md"><div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600"><Lightbulb className="h-7 w-7" /></div><h3 className="mb-3 text-xl font-bold text-slate-900">{str(t?.features?.tailored_title)}</h3><p className="text-slate-600 leading-relaxed">{str(t?.features?.tailored_description)}</p></div>
                    </div>
                </div>
            </section>

            <section id="recent-jobs" className="bg-white py-14 sm:py-20 border-t border-slate-200">
                <div className="mx-auto max-w-6xl px-5 sm:px-6">
                    <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">{str(t?.jobs_section?.title)}</h2>
                            <p className="mt-2 text-slate-600">{str(t?.jobs_section?.description)}</p>
                        </div>
                        <Link href="/tuition-jobs" className="inline-flex self-start items-center rounded-full bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-700 border border-blue-100 hover:bg-blue-100">{str(t?.jobs_section?.view_all)}</Link>
                    </div>

                    {posts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 py-24 text-center">
                            <div className="rounded-full bg-white p-5 shadow-sm mb-5"><Search className="h-8 w-8 text-slate-400" /></div>
                            <h3 className="text-xl font-bold text-slate-900">{str(t?.jobs_section?.none_title)}</h3>
                            <p className="mt-2 text-slate-600 max-w-sm">{str(t?.jobs_section?.none_description)}</p>
                        </div>
                    ) : (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{posts.map((post) => (<TuitionCard key={post.id} post={post} t={t} locale={locale} />))}</div>
                    )}
                </div>
            </section>

            <section className="bg-slate-50 py-24 border-t border-slate-200">
                <div className="mx-auto max-w-6xl px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">{str(t?.how?.title)}</h2>
                        <p className="mt-4 text-slate-600 text-lg">{str(t?.how?.description)}</p>
                    </div>

                    <div className="grid gap-8 lg:grid-cols-2">
                        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm lg:p-12 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-4 -mt-4"></div>
                            <div className="relative"><div className="mb-8 flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700"><Users className="h-7 w-7" /></div><h3 className="text-2xl font-bold text-slate-900">{str(t?.how?.guardians_title)}</h3></div><ul className="space-y-6">{stepsGuardians.map((step, i) => (<li key={i} className="flex items-start gap-4"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-sm shadow-md">{(i + 1).toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-US')}</div><p className="pt-1 text-slate-700 font-medium">{step}</p></li>))}</ul></div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm lg:p-12 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -mr-4 -mt-4"></div>
                            <div className="relative"><div className="mb-8 flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700"><BookMarked className="h-7 w-7" /></div><h3 className="text-2xl font-bold text-slate-900">{str(t?.how?.tutors_title)}</h3></div><ul className="space-y-6">{stepsTutors.map((step, i) => (<li key={i} className="flex items-start gap-4"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white font-bold text-sm shadow-md">{(i + 1).toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-US')}</div><p className="pt-1 text-slate-700 font-medium">{step}</p></li>))}</ul></div>
                        </div>
                    </div>
                </div>
            </section>

            {!auth.user && canRegister && (
                <section className="bg-blue-900 py-24 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10"><svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/></pattern></defs><rect width="100%" height="100%" fill="url(#grid)" /></svg></div>
                    <div className="relative mx-auto max-w-4xl px-4 text-center">
                        <h2 className="mb-6 text-4xl font-extrabold text-white md:text-5xl">{str(t?.cta?.title)}</h2>
                        <p className="mb-10 text-xl text-blue-200">{str(t?.cta?.description)}</p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link href={register()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-8 py-4 font-bold text-white shadow-lg transition hover:bg-amber-400 hover:-translate-y-1 hover:shadow-xl">{str(t?.cta?.create_account)}<ArrowRight className="h-5 w-5" /></Link>
                            <Link href={login()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-800 px-8 py-4 font-bold text-white border border-blue-700 transition hover:bg-blue-700">{str(t?.cta?.sign_in)}</Link>
                        </div>
                    </div>
                </section>
            )}

            <footer className="bg-slate-900 py-8 text-slate-400">
                <div className="mx-auto max-w-6xl px-4 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2 text-2xl font-bold tracking-tight text-white"><BookOpen className="h-6 w-6 text-blue-500" />{str(t?.brand?.tuition)}<span className="text-amber-500">{str(t?.brand?.media)}</span></div>
                    <p className="text-sm">{replaceVars(str(t?.footer?.copyright), { year: new Date().getFullYear() })}</p>
                    <div className="flex gap-6 text-sm font-medium">
                        <Link href="#" className="hover:text-white transition">{str(t?.footer?.terms)}</Link>
                        <Link href="#" className="hover:text-white transition">{str(t?.footer?.privacy)}</Link>
                        <Link href="#" className="hover:text-white transition">{str(t?.footer?.contact)}</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}

