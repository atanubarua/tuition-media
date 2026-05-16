import { Head, Link, router, usePage } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import PublicNavbar from '@/components/public-navbar';
import AutocompleteInput from '@/components/autocomplete-input';
import { MapPin, Calendar, User, Search, GraduationCap, Filter, BookOpen, Loader2 } from 'lucide-react';

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
    published_at: string;
    students: Student[];
};

type PaginatedPosts = {
    data: Post[];
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
    last_page: number;
};

type T = Record<string, any>;

function str(value: unknown, fallback = ''): string {
    return typeof value === 'string' ? value : fallback;
}

function replaceVars(template: string, vars: Record<string, string | number>) {
    return Object.entries(vars).reduce((r, [k, v]) => r.replace(`:${k}`, String(v)), template);
}

function salaryLabel(post: Post, t: T) {
    const negotiable = str(t?.tuition_jobs?.salary_negotiable, 'Negotiable');
    if (post.salary_type === 'negotiable') return negotiable;
    if (post.salary_type === 'range' && post.salary_min && post.salary_max) {
        return `৳${post.salary_min.toLocaleString()} - ৳${post.salary_max.toLocaleString()}`;
    }
    if (post.salary_min) return `৳${post.salary_min.toLocaleString()}`;
    return negotiable;
}

function levelLabel(level: string, t: T) {
    return str(t?.card?.levels?.[level], level);
}

function TuitionCard({ post, t }: { post: Post; t: T }) {
    const allSubjects = [...new Set(post.students.flatMap((s) => s.subjects.map((sub) => sub.name)))];
    const levels = [...new Set(post.students.map((s) => levelLabel(s.academic_level, t)))];

    return (
        <Link href={`/tuition-posts/${post.id}`} className="group flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
                <h3 className="font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-blue-700 transition-colors">
                    {post.title || replaceVars(str(t?.card?.default_title, 'Tuition in :subdistrict'), { subdistrict: post.subdistrict_name })}
                </h3>
                <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                    {salaryLabel(post, t)}
                </span>
            </div>

            <div className="flex flex-wrap gap-2">
                {allSubjects.slice(0, 3).map((s) => (
                    <span key={s} className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 border border-blue-100/50">
                        {s}
                    </span>
                ))}
            </div>

            <div className="mt-auto pt-4 border-t border-slate-100 flex flex-wrap gap-y-3 gap-x-5 text-sm text-slate-500">
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span className="truncate">{post.subdistrict_name}, {post.district_name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4 text-slate-400" />
                    <span className="truncate">{levels.join(', ')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span>{replaceVars(str(t?.tuition_jobs?.days_week, ':count d/wk'), { count: post.days_per_week })}</span>
                </div>
                {post.tutor_gender_preference !== 'any' && (
                    <div className="flex items-center gap-1.5">
                        <User className="h-4 w-4 text-slate-400" />
                        <span className="capitalize">
                            {replaceVars(str(t?.tuition_jobs?.tutor_suffix, ':gender Tutor'), { gender: post.tutor_gender_preference })}
                        </span>
                    </div>
                )}
            </div>
        </Link>
    );
}

export default function TuitionJobsPage({
    posts,
    filters,
    canRegister = true,
}: {
    posts: PaginatedPosts;
    filters: { location: string; subject: string; gender: string; level: string; min_salary: number | null; max_days: number | null };
    canRegister?: boolean;
}) {
    const { translations: t } = usePage().props as any;
    const [location, setLocation] = useState(filters.location ?? '');
    const [subject, setSubject] = useState(filters.subject ?? '');
    const [gender, setGender] = useState(filters.gender ?? 'any');
    const [level, setLevel] = useState(filters.level ?? '');
    const [minSalary, setMinSalary] = useState(filters.min_salary ? String(filters.min_salary) : '');
    const [maxDays, setMaxDays] = useState(filters.max_days ? String(filters.max_days) : '');
    const [isFiltering, setIsFiltering] = useState(false);

    const onSubmit = (e: FormEvent) => {
        e.preventDefault();
        router.get('/tuition-jobs', {
            location: location.trim() || undefined,
            subject: subject.trim() || undefined,
            gender: gender !== 'any' ? gender : undefined,
            level: level || undefined,
            min_salary: minSalary.trim() || undefined,
            max_days: maxDays.trim() || undefined,
        }, {
            preserveState: true,
            preserveScroll: true,
            onStart: () => setIsFiltering(true),
            onError: () => setIsFiltering(false),
            onFinish: () => setIsFiltering(false),
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <Head title={str(t?.tuition_jobs?.page_title, 'All Tuition Jobs - Tuition Media')} />
            {isFiltering && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center bg-white/75 backdrop-blur-sm">
                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-lg">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                        <p className="text-sm font-semibold text-slate-700">{str(t?.find_tutors?.applying_filters, 'Applying filters...')}</p>
                    </div>
                </div>
            )}
            <PublicNavbar canRegister={canRegister} active="tuition-jobs" />

            <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
                <h1 className="text-3xl font-extrabold text-slate-900 md:text-4xl">{str(t?.tuition_jobs?.heading, 'All Tuition Jobs')}</h1>
                <p className="mt-2 text-slate-600">{str(t?.tuition_jobs?.subheading, 'Browse all available tuition posts with tutor-focused filters.')}</p>

                <div className="mt-8 flex flex-col gap-8 lg:flex-row">
                    <aside className="w-full lg:w-80 shrink-0">
                        <form onSubmit={onSubmit} className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                                <Filter className="h-4 w-4 text-blue-600" />
                                <h2 className="text-sm font-bold text-slate-900">{str(t?.tuition_jobs?.filter_heading, 'Filter Tuition Jobs')}</h2>
                            </div>

                            <div className="space-y-4">
                                <AutocompleteInput
                                    value={location}
                                    onChange={setLocation}
                                    fetchUrl={(q) => `/api/locations?q=${encodeURIComponent(q)}`}
                                    mapLabel={(s) => s.label}
                                    mapValue={(s) => s.name}
                                    placeholder={str(t?.tuition_jobs?.placeholder_location, 'Area or District...')}
                                    icon={<MapPin className="h-4 w-4 text-slate-400" />}
                                    className="w-full rounded-xl border border-slate-300 pl-10 px-4 py-2.5 text-sm"
                                />
                                <AutocompleteInput
                                    value={subject}
                                    onChange={setSubject}
                                    fetchUrl={(q) => `/api/subjects?q=${encodeURIComponent(q)}`}
                                    mapLabel={(s) => s}
                                    mapValue={(s) => s}
                                    placeholder={str(t?.tuition_jobs?.placeholder_subject, 'Subject or Class...')}
                                    icon={<BookOpen className="h-4 w-4 text-slate-400" />}
                                    className="w-full rounded-xl border border-slate-300 pl-10 px-4 py-2.5 text-sm"
                                />
                                <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm">
                                    <option value="any">{str(t?.tuition_jobs?.any_gender, 'Any Tutor Gender')}</option>
                                    <option value="male">{str(t?.tuition_jobs?.male_tutor, 'Male Tutor')}</option>
                                    <option value="female">{str(t?.tuition_jobs?.female_tutor, 'Female Tutor')}</option>
                                </select>
                                <select value={level} onChange={(e) => setLevel(e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm">
                                    <option value="">{str(t?.tuition_jobs?.any_level, 'Any Academic Level')}</option>
                                    <option value="primary">{str(t?.card?.levels?.primary, 'Primary')}</option>
                                    <option value="high_school">{str(t?.card?.levels?.high_school, 'High School')}</option>
                                    <option value="college">{str(t?.card?.levels?.college, 'College')}</option>
                                    <option value="honors">{str(t?.card?.levels?.honors, 'Honors')}</option>
                                </select>
                                <input value={minSalary} onChange={(e) => setMinSalary(e.target.value)} placeholder={str(t?.tuition_jobs?.placeholder_min_salary, 'Minimum Budget (BDT)')} type="number" min={0} className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm" />
                                <input value={maxDays} onChange={(e) => setMaxDays(e.target.value)} placeholder={str(t?.tuition_jobs?.placeholder_max_days, 'Max Days/Week')} type="number" min={1} max={7} className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm" />
                            </div>

                            <div className="mt-5 flex gap-2">
                                <button type="submit" disabled={isFiltering} className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed">
                                    {str(t?.tuition_jobs?.apply, 'Apply')}
                                </button>
                                <Link href="/tuition-jobs" className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200">{str(t?.tuition_jobs?.reset, 'Reset')}</Link>
                            </div>
                        </form>
                    </aside>

                    <main className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-slate-600">
                            {replaceVars(str(t?.tuition_jobs?.posts_found, ':count posts found'), { count: posts.total })}
                        </div>

                        {posts.data.length === 0 ? (
                            <div className="mt-6 rounded-3xl border-2 border-dashed border-slate-200 bg-white py-20 text-center">
                                <Search className="mx-auto h-8 w-8 text-slate-400" />
                                <p className="mt-3 text-slate-600">{str(t?.tuition_jobs?.no_posts, 'No tuition posts found for your search.')}</p>
                            </div>
                        ) : (
                            <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                                {posts.data.map((post) => <TuitionCard key={post.id} post={post} t={t} />)}
                            </div>
                        )}

                        {posts.last_page > 1 && (
                            <div className="mt-10 flex justify-center">
                                <div className="inline-flex overflow-hidden rounded-xl border border-slate-200 bg-white">
                                    {posts.links.map((link, i) => (
                                        link.url ? (
                                            <button key={i} onClick={() => { setIsFiltering(true); router.visit(link.url!, { preserveState: true, onFinish: () => setIsFiltering(false) }); }} className={`px-4 py-2 text-sm cursor-pointer ${link.active ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`} dangerouslySetInnerHTML={{ __html: link.label }} />
                                        ) : (
                                            <span key={i} className="px-4 py-2 text-sm text-slate-400" dangerouslySetInnerHTML={{ __html: link.label }} />
                                        )
                                    ))}
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}
