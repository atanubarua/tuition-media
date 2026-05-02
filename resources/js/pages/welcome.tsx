import { Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { dashboard, login, register } from '@/routes';

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
    if (post.salary_type === 'negotiable') return 'Negotiable';
    if (post.salary_type === 'range' && post.salary_min && post.salary_max)
        return `৳${post.salary_min.toLocaleString()} – ৳${post.salary_max.toLocaleString()}`;
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
        <Link href={`/tuition-posts/${post.id}`} className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-blue-200">
            <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-gray-900 leading-snug">
                    {post.title || `Tuition in ${post.subdistrict_name}`}
                </h3>
                <span className="shrink-0 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                    {salaryLabel(post)}
                </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
                {allSubjects.slice(0, 4).map((s) => (
                    <span key={s} className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs text-blue-700">{s}</span>
                ))}
                {allSubjects.length > 4 && (
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-500">+{allSubjects.length - 4} more</span>
                )}
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                <span>📍 {post.subdistrict_name}, {post.district_name}</span>
                <span>📚 {levels.join(', ')}</span>
                <span>📅 {post.days_per_week}d/week</span>
                {post.tutor_gender_preference !== 'any' && (
                    <span>👤 {post.tutor_gender_preference === 'male' ? 'Male tutor' : 'Female tutor'}</span>
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
    const { auth } = usePage().props;
    const [search, setSearch] = useState('');

    const filtered = search.trim()
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

    return (
        <>
            <Head title="Tuition Media – Find Tutors & Tuition Jobs in Bangladesh" />

            {/* Navbar */}
            <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
                    <Link href="/" className="text-xl font-bold text-blue-600">
                        Tuition<span className="text-gray-800">Media</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        {auth.user ? (
                            <Link href={dashboard()} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link href={login()} className="text-sm font-medium text-gray-600 hover:text-gray-900">
                                    Log in
                                </Link>
                                {canRegister && (
                                    <Link href={register()} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                                        Register
                                    </Link>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="bg-gradient-to-br from-blue-600 to-blue-800 py-16 text-white">
                <div className="mx-auto max-w-3xl px-4 text-center">
                    <h1 className="mb-3 text-4xl font-bold leading-tight md:text-5xl">
                        Find the Right Tutor<br />Across Bangladesh
                    </h1>
                    <p className="mb-8 text-blue-100 text-lg">
                        Guardians post tuition jobs. Qualified tutors apply. Simple.
                    </p>
                    <div className="flex overflow-hidden rounded-xl bg-white shadow-lg">
                        <input
                            type="text"
                            placeholder="Search by area, subject, or class level…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="flex-1 px-5 py-3.5 text-gray-800 outline-none placeholder:text-gray-400"
                        />
                        <button className="bg-blue-600 px-6 py-3.5 font-medium text-white hover:bg-blue-700">
                            Search
                        </button>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="border-b bg-white py-8">
                <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-8 px-4 text-center">
                    <div>
                        <p className="text-3xl font-bold text-blue-600">{stats.total_posts.toLocaleString()}+</p>
                        <p className="text-sm text-gray-500 mt-1">Active Tuition Posts</p>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-blue-600">{stats.total_tutors.toLocaleString()}+</p>
                        <p className="text-sm text-gray-500 mt-1">Registered Tutors</p>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-blue-600">64</p>
                        <p className="text-sm text-gray-500 mt-1">Districts Covered</p>
                    </div>
                </div>
            </section>

            {/* Tuition List */}
            <section className="bg-gray-50 py-12">
                <div className="mx-auto max-w-6xl px-4">
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-900">Latest Tuition Posts</h2>
                        <span className="text-sm text-gray-500">{filtered.length} posts</span>
                    </div>

                    {filtered.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center text-gray-400">
                            {search ? 'No posts match your search.' : 'No tuition posts yet.'}
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {filtered.map((post) => (
                                <TuitionCard key={post.id} post={post} />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* How it works */}
            <section className="bg-white py-14">
                <div className="mx-auto max-w-5xl px-4">
                    <h2 className="mb-10 text-center text-2xl font-bold text-gray-900">How It Works</h2>
                    <div className="grid gap-8 md:grid-cols-2">
                        <div className="rounded-xl border border-blue-100 bg-blue-50 p-6">
                            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-600">For Guardians</p>
                            <ol className="space-y-2 text-gray-700 text-sm list-decimal list-inside">
                                <li>Register as a guardian</li>
                                <li>Post your tuition requirement with details</li>
                                <li>Receive applications from qualified tutors</li>
                                <li>Select the best match for your child</li>
                            </ol>
                        </div>
                        <div className="rounded-xl border border-green-100 bg-green-50 p-6">
                            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-green-600">For Tutors</p>
                            <ol className="space-y-2 text-gray-700 text-sm list-decimal list-inside">
                                <li>Register as a tutor</li>
                                <li>Complete your tutor profile</li>
                                <li>Browse available tuition posts</li>
                                <li>Apply to posts that match your expertise</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            {!auth.user && canRegister && (
                <section className="bg-blue-600 py-14 text-center text-white">
                    <h2 className="mb-3 text-2xl font-bold">Ready to get started?</h2>
                    <p className="mb-6 text-blue-100">Join thousands of guardians and tutors across Bangladesh.</p>
                    <Link href={register()} className="rounded-lg bg-white px-8 py-3 font-semibold text-blue-600 hover:bg-blue-50">
                        Create Free Account
                    </Link>
                </section>
            )}

            {/* Footer */}
            <footer className="border-t bg-gray-900 py-8 text-center text-sm text-gray-400">
                <p>© {new Date().getFullYear()} TuitionMedia. All rights reserved.</p>
            </footer>
        </>
    );
}
