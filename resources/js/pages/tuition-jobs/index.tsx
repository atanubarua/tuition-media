import { Head, Link, router } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import PublicNavbar from '@/components/public-navbar';
import { MapPin, Calendar, User, Search, GraduationCap, Filter } from 'lucide-react';

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

function salaryLabel(post: Post) {
    if (post.salary_type === 'negotiable') return 'Negotiable';
    if (post.salary_type === 'range' && post.salary_min && post.salary_max) {
        return `৳${post.salary_min.toLocaleString()} - ৳${post.salary_max.toLocaleString()}`;
    }
    if (post.salary_min) return `৳${post.salary_min.toLocaleString()}`;
    return 'Negotiable';
}

function levelLabel(level: string) {
    return { primary: 'Primary', high_school: 'High School', college: 'College', honors: 'Honors' }[level] ?? level;
}

function TuitionCard({ post }: { post: Post }) {
    const allSubjects = [...new Set(post.students.flatMap((s) => s.subjects.map((sub) => sub.name)))];
    const levels = [...new Set(post.students.map((s) => levelLabel(s.academic_level)))];

    return (
        <Link href={`/tuition-posts/${post.id}`} className="group flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
                <h3 className="font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-blue-700 transition-colors">
                    {post.title || `Tuition in ${post.subdistrict_name}`}
                </h3>
                <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                    {salaryLabel(post)}
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
                    <span>{post.days_per_week}d/wk</span>
                </div>
                {post.tutor_gender_preference !== 'any' && (
                    <div className="flex items-center gap-1.5">
                        <User className="h-4 w-4 text-slate-400" />
                        <span className="capitalize">{post.tutor_gender_preference} Tutor</span>
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
    const [location, setLocation] = useState(filters.location ?? '');
    const [subject, setSubject] = useState(filters.subject ?? '');
    const [gender, setGender] = useState(filters.gender ?? 'any');
    const [level, setLevel] = useState(filters.level ?? '');
    const [minSalary, setMinSalary] = useState(filters.min_salary ? String(filters.min_salary) : '');
    const [maxDays, setMaxDays] = useState(filters.max_days ? String(filters.max_days) : '');

    const onSubmit = (e: FormEvent) => {
        e.preventDefault();
        router.get('/tuition-jobs', {
            location: location.trim() || undefined,
            subject: subject.trim() || undefined,
            gender: gender !== 'any' ? gender : undefined,
            level: level || undefined,
            min_salary: minSalary.trim() || undefined,
            max_days: maxDays.trim() || undefined,
        }, { preserveState: true, preserveScroll: true });
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <Head title="All Tuition Jobs - Tuition Media" />
            <PublicNavbar canRegister={canRegister} active="tuition-jobs" />

            <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
                <h1 className="text-3xl font-extrabold text-slate-900 md:text-4xl">All Tuition Jobs</h1>
                <p className="mt-2 text-slate-600">Browse all available tuition posts with tutor-focused filters.</p>

                <div className="mt-8 flex flex-col gap-8 lg:flex-row">
                    <aside className="w-full lg:w-80 shrink-0">
                        <form onSubmit={onSubmit} className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                                <Filter className="h-4 w-4 text-blue-600" />
                                <h2 className="text-sm font-bold text-slate-900">Filter Tuition Jobs</h2>
                            </div>

                            <div className="space-y-4">
                                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Area or District..." className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm" />
                                <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject or Class..." className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm" />
                                <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm">
                                    <option value="any">Any Tutor Gender</option>
                                    <option value="male">Male Tutor</option>
                                    <option value="female">Female Tutor</option>
                                </select>
                                <select value={level} onChange={(e) => setLevel(e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm">
                                    <option value="">Any Academic Level</option>
                                    <option value="primary">Primary</option>
                                    <option value="high_school">High School</option>
                                    <option value="college">College</option>
                                    <option value="honors">Honors</option>
                                </select>
                                <input value={minSalary} onChange={(e) => setMinSalary(e.target.value)} placeholder="Minimum Budget (BDT)" type="number" min={0} className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm" />
                                <input value={maxDays} onChange={(e) => setMaxDays(e.target.value)} placeholder="Max Days/Week" type="number" min={1} max={7} className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm" />
                            </div>

                            <div className="mt-5 flex gap-2">
                                <button type="submit" className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Apply</button>
                                <Link href="/tuition-jobs" className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200">Reset</Link>
                            </div>
                        </form>
                    </aside>

                    <main className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-slate-600">{posts.total} posts found</div>

                        {posts.data.length === 0 ? (
                            <div className="mt-6 rounded-3xl border-2 border-dashed border-slate-200 bg-white py-20 text-center">
                                <Search className="mx-auto h-8 w-8 text-slate-400" />
                                <p className="mt-3 text-slate-600">No tuition posts found for your search.</p>
                            </div>
                        ) : (
                            <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                                {posts.data.map((post) => <TuitionCard key={post.id} post={post} />)}
                            </div>
                        )}

                        {posts.last_page > 1 && (
                            <div className="mt-10 flex justify-center">
                                <div className="inline-flex overflow-hidden rounded-xl border border-slate-200 bg-white">
                                    {posts.links.map((link, i) => (
                                        link.url ? (
                                            <Link key={i} href={link.url} className={`px-4 py-2 text-sm ${link.active ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`} dangerouslySetInnerHTML={{ __html: link.label }} />
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

