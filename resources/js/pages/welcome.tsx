import { Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { dashboard, login, register } from '@/routes';
import {
    BookOpen,
    MapPin,
    Calendar,
    User,
    Search,
    GraduationCap,
    ArrowRight,
    Users,
    Briefcase,
    ShieldCheck,
    BookMarked,
    Lightbulb
} from 'lucide-react';

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

function salaryLabel(post: Post) {
    if (post.salary_type === 'negotiable') {
        return 'Negotiable';
    }

    if (post.salary_type === 'range' && post.salary_min && post.salary_max) {
        return `৳${post.salary_min.toLocaleString()} – ৳${post.salary_max.toLocaleString()}`;
    }

    if (post.salary_min) {
        return `৳${post.salary_min.toLocaleString()}`;
    }

    return 'Negotiable';
}

function levelLabel(level: string) {
    return { primary: 'Primary', high_school: 'High School', college: 'College', honors: 'Honors' }[level] ?? level;
}

function TuitionCard({ post }: { post: Post }) {
    const allSubjects = [...new Set(post.students.flatMap((s) => s.subjects.map((sub) => sub.name)))];
    const levels = [...new Set(post.students.map((s) => levelLabel(s.academic_level)))];

    return (
        <Link
            href={`/tuition-posts/${post.id}`}
            className="group flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-md"
        >
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
                {allSubjects.length > 3 && (
                    <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 border border-slate-200/50">
                        +{allSubjects.length - 3} more
                    </span>
                )}
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

export default function Welcome({
    canRegister = true,
    posts = [],
    stats = { total_posts: 0, total_tutors: 0 },
}: {
    canRegister?: boolean;
    posts?: Post[];
    stats?: { total_posts: number; total_tutors: number };
}) {
    const { auth } = usePage().props as any;
    const [search, setSearch] = useState('');
    const [searchMode, setSearchMode] = useState<'tutor' | 'job'>('tutor');

    // Only filter jobs if search mode is 'job'
    const filtered = (search.trim() && searchMode === 'job')
        ? posts.filter((p) => {
              const q = search.toLowerCase();

              return (
                  p.district_name.toLowerCase().includes(q) ||
                  p.subdistrict_name.toLowerCase().includes(q) ||
                  (p.title ?? '').toLowerCase().includes(q) ||
                  p.students.some((s) => s.subjects.some((sub) => sub.name.toLowerCase().includes(q)))
              );
          })
        : posts;

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchMode === 'tutor') {
            // Redirect to Find Tutors page with query
            window.location.href = `/find-tutors?q=${encodeURIComponent(search)}`;
        } else {
            // Smooth scroll to jobs section
            document.getElementById('recent-jobs')?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-blue-200 selection:text-blue-900">
            <Head title="Tuition Media – Find Tutors & Tuition Jobs in Bangladesh" />

            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md transition-all">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
                    <div className="flex items-center gap-10">
                        <Link href="/" className="flex items-center gap-2 text-2xl font-bold tracking-tight text-blue-900">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                                <BookOpen className="h-5 w-5" />
                            </div>
                            Tuition<span className="text-amber-500">Media</span>
                        </Link>
                        
                        <div className="hidden md:flex items-center gap-6">
                            <Link href="/find-tutors" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition">
                                Find Tutors
                            </Link>
                            <Link href="/tuition-jobs" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition">
                                Tuition Jobs
                            </Link>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {auth.user ? (
                            <Link href={dashboard.url()} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link href={login()} className="text-sm font-semibold text-slate-600 transition hover:text-blue-600">
                                    Log in
                                </Link>
                                {canRegister && (
                                    <Link href={register()} className="hidden sm:inline-flex rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
                                        Register Free
                                    </Link>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="relative overflow-hidden bg-slate-50 pt-32 pb-20 lg:pt-40 lg:pb-28">
                {/* Decorative background elements appropriate for education */}
                <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3">
                    <svg width="404" height="404" fill="none" viewBox="0 0 404 404" aria-hidden="true" className="text-blue-100 opacity-50">
                        <defs>
                            <pattern id="85737c0e-0916-41d7-917f-596dc7edfa27" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                                <rect x="0" y="0" width="4" height="4" fill="currentColor"></rect>
                            </pattern>
                        </defs>
                        <rect width="404" height="404" fill="url(#85737c0e-0916-41d7-917f-596dc7edfa27)"></rect>
                    </svg>
                </div>
                
                <div className="absolute left-0 bottom-0 translate-y-1/3 -translate-x-1/3">
                    <svg width="404" height="404" fill="none" viewBox="0 0 404 404" aria-hidden="true" className="text-amber-100 opacity-50">
                        <defs>
                            <pattern id="85737c0e-0916-41d7-917f-596dc7edfa28" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                                <rect x="0" y="0" width="4" height="4" fill="currentColor"></rect>
                            </pattern>
                        </defs>
                        <rect width="404" height="404" fill="url(#85737c0e-0916-41d7-917f-596dc7edfa28)"></rect>
                    </svg>
                </div>

                <div className="relative mx-auto max-w-5xl px-4 text-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-700 mb-8">
                        <GraduationCap className="h-4 w-4" />
                        <span>Bangladesh's Premier Tutoring Platform</span>
                    </div>

                    <h1 className="mb-6 text-5xl font-extrabold tracking-tight text-slate-900 md:text-7xl lg:leading-[1.1]">
                        Unlock Your Child's <br className="hidden md:block" />
                        <span className="relative whitespace-nowrap">
                            <span className="relative text-blue-600">Full Potential</span>
                        </span>
                    </h1>

                    <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-600 md:text-xl">
                        Connect with expert tutors across Bangladesh. From primary school to university-level subjects, find the perfect academic mentor today.
                    </p>

                    <div className="mx-auto max-w-2xl">
                        {/* Search Toggle */}
                        <div className="flex justify-center mb-6">
                            <div className="inline-flex rounded-full bg-slate-200/60 p-1 backdrop-blur-sm border border-slate-300/50">
                                <button
                                    onClick={() => setSearchMode('tutor')}
                                    className={`rounded-full px-6 py-2.5 text-sm font-bold transition-all ${searchMode === 'tutor' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                                >
                                    I need a Tutor
                                </button>
                                <button
                                    onClick={() => setSearchMode('job')}
                                    className={`rounded-full px-6 py-2.5 text-sm font-bold transition-all ${searchMode === 'job' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                                >
                                    I want to Teach
                                </button>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-3 rounded-2xl bg-white p-2 shadow-xl shadow-blue-900/5 ring-1 ring-slate-200">
                            <div className="flex w-full items-center pl-4 pr-2">
                                <Search className="h-6 w-6 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder={searchMode === 'tutor' ? "Search for Math, Class 9, Mirpur..." : "Search available tuition jobs..."}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full bg-transparent px-4 py-3.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 border-none text-lg"
                                />
                            </div>
                            <button type="submit" className="w-full sm:w-auto shrink-0 rounded-xl bg-blue-600 px-8 py-4 font-bold text-white transition hover:bg-blue-700 shadow-md hover:shadow-lg">
                                {searchMode === 'tutor' ? 'Find Tutors' : 'Find Tuitions'}
                            </button>
                        </form>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="bg-white border-y border-slate-200 py-10">
                <div className="mx-auto max-w-5xl px-4">
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 text-center">
                        <div className="pt-4 sm:pt-0">
                            <p className="text-4xl font-extrabold text-blue-700">{stats.total_posts.toLocaleString()}+</p>
                            <p className="mt-2 text-sm font-bold text-slate-500 uppercase tracking-wider">Tuition Jobs</p>
                        </div>
                        <div className="pt-4 sm:pt-0">
                            <p className="text-4xl font-extrabold text-blue-700">{stats.total_tutors.toLocaleString()}+</p>
                            <p className="mt-2 text-sm font-bold text-slate-500 uppercase tracking-wider">Expert Tutors</p>
                        </div>
                        <div className="pt-4 sm:pt-0">
                            <p className="text-4xl font-extrabold text-blue-700">64</p>
                            <p className="mt-2 text-sm font-bold text-slate-500 uppercase tracking-wider">Districts Covered</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-20 bg-slate-50">
                <div className="mx-auto max-w-6xl px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">Why Choose TuitionMedia?</h2>
                        <p className="mt-4 text-slate-600 text-lg max-w-2xl mx-auto">We provide a safe, reliable, and effective platform to connect students with the best educators.</p>
                    </div>
                    <div className="grid gap-8 md:grid-cols-3">
                        <div className="rounded-2xl bg-white p-8 border border-slate-200 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                            <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                                <ShieldCheck className="h-7 w-7" />
                            </div>
                            <h3 className="mb-3 text-xl font-bold text-slate-900">Verified Quality</h3>
                            <p className="text-slate-600 leading-relaxed">Tutor profiles can be carefully reviewed to ensure academic excellence and safety for your child.</p>
                        </div>
                        <div className="rounded-2xl bg-white p-8 border border-slate-200 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                            <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                                <MapPin className="h-7 w-7" />
                            </div>
                            <h3 className="mb-3 text-xl font-bold text-slate-900">Local & Nationwide</h3>
                            <p className="text-slate-600 leading-relaxed">Find expert tutors in your local neighborhood or connect with top educators online across Bangladesh.</p>
                        </div>
                        <div className="rounded-2xl bg-white p-8 border border-slate-200 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                            <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                                <Lightbulb className="h-7 w-7" />
                            </div>
                            <h3 className="mb-3 text-xl font-bold text-slate-900">Tailored Learning</h3>
                            <p className="text-slate-600 leading-relaxed">Whether it's one-on-one home tutoring or group batches, find the teaching style that fits best.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Tuition List */}
            <section id="recent-jobs" className="bg-white py-20 border-t border-slate-200">
                <div className="mx-auto max-w-6xl px-4">
                    <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900">Recent Tuition Jobs</h2>
                            <p className="mt-2 text-slate-600">Browse the latest requirements posted by guardians.</p>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-700 border border-blue-100">
                            {filtered.length} posts available
                        </span>
                    </div>

                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 py-24 text-center">
                            <div className="rounded-full bg-white p-5 shadow-sm mb-5">
                                <Search className="h-8 w-8 text-slate-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">No jobs found</h3>
                            <p className="mt-2 text-slate-600 max-w-sm">
                                {search && searchMode === 'job' ? "We couldn't find any posts matching your search criteria. Try using different keywords." : "There are no tuition posts available at the moment."}
                            </p>
                            {search && searchMode === 'job' && (
                                <button 
                                    onClick={() => setSearch('')}
                                    className="mt-6 font-semibold text-blue-600 hover:text-blue-700"
                                >
                                    Clear search filters
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {filtered.map((post) => (
                                <TuitionCard key={post.id} post={post} />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* How it works */}
            <section className="bg-slate-50 py-24 border-t border-slate-200">
                <div className="mx-auto max-w-6xl px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">How It Works</h2>
                        <p className="mt-4 text-slate-600 text-lg">A transparent, easy-to-use platform for everyone.</p>
                    </div>
                    
                    <div className="grid gap-8 lg:grid-cols-2">
                        {/* Guardians */}
                        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm lg:p-12 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-4 -mt-4"></div>
                            <div className="relative">
                                <div className="mb-8 flex items-center gap-4">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                                        <Users className="h-7 w-7" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900">For Guardians</h3>
                                </div>
                                <ul className="space-y-6">
                                    {[
                                        'Create a free guardian account',
                                        'Post your detailed tuition requirement',
                                        'Review applications from qualified tutors',
                                        'Select the perfect match for your child'
                                    ].map((step, i) => (
                                        <li key={i} className="flex items-start gap-4">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-sm shadow-md">
                                                {i + 1}
                                            </div>
                                            <p className="pt-1 text-slate-700 font-medium">{step}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Tutors */}
                        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm lg:p-12 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -mr-4 -mt-4"></div>
                            <div className="relative">
                                <div className="mb-8 flex items-center gap-4">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                                        <BookMarked className="h-7 w-7" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900">For Tutors</h3>
                                </div>
                                <ul className="space-y-6">
                                    {[
                                        'Register and build your professional profile',
                                        'Browse available tuition jobs in your area',
                                        'Apply to positions matching your expertise',
                                        'Start teaching and building your career'
                                    ].map((step, i) => (
                                        <li key={i} className="flex items-start gap-4">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white font-bold text-sm shadow-md">
                                                {i + 1}
                                            </div>
                                            <p className="pt-1 text-slate-700 font-medium">{step}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            {!auth.user && canRegister && (
                <section className="bg-blue-900 py-24 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10">
                        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
                                </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#grid)" />
                        </svg>
                    </div>
                    
                    <div className="relative mx-auto max-w-4xl px-4 text-center">
                        <h2 className="mb-6 text-4xl font-extrabold text-white md:text-5xl">Ready to get started?</h2>
                        <p className="mb-10 text-xl text-blue-200">Join thousands of students and educators building a brighter future.</p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link href={register()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-8 py-4 font-bold text-white shadow-lg transition hover:bg-amber-400 hover:-translate-y-1 hover:shadow-xl">
                                Create Free Account
                                <ArrowRight className="h-5 w-5" />
                            </Link>
                            <Link href={login()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-800 px-8 py-4 font-bold text-white border border-blue-700 transition hover:bg-blue-700">
                                Sign In
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            {/* Footer */}
            <footer className="bg-slate-900 py-12 text-slate-400">
                <div className="mx-auto max-w-6xl px-4 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2 text-2xl font-bold tracking-tight text-white">
                        <BookOpen className="h-6 w-6 text-blue-500" />
                        Tuition<span className="text-amber-500">Media</span>
                    </div>
                    <p className="text-sm">
                        © {new Date().getFullYear()} TuitionMedia. All rights reserved.
                    </p>
                    <div className="flex gap-6 text-sm font-medium">
                        <Link href="#" className="hover:text-white transition">Terms</Link>
                        <Link href="#" className="hover:text-white transition">Privacy</Link>
                        <Link href="#" className="hover:text-white transition">Contact</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
