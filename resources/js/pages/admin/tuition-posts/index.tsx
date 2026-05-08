import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';

type Post = {
    id: number;
    tuition_code: string | null;
    title: string | null;
    status: string;
    salary_type: string;
    salary_min: number | null;
    salary_max: number | null;
    days_per_week: number;
    students_count: number;
    applications_count: number;
    application_status_counts: {
        pending: number;
        shortlisted: number;
        rejected: number;
        hired: number;
    };
    guardian: { id: number; name: string; email: string } | null;
    created_at: string;
};

type Props = {
    posts: Post[];
    filters: { status: string };
    statuses: string[];
};

const STATUS_STYLES: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700',
    published: 'bg-emerald-100 text-emerald-700',
    shortlisted: 'bg-sky-100 text-sky-700',
    assigned: 'bg-amber-100 text-amber-700',
    completed: 'bg-indigo-100 text-indigo-700',
    closed: 'bg-zinc-200 text-zinc-700',
    cancelled: 'bg-rose-100 text-rose-700',
};

export default function AdminTuitionPostsIndex({ posts, filters, statuses }: Props) {
    const formatDate = (value: string) => new Date(value).toISOString().slice(0, 10);
    const [status, setStatus] = useState(filters.status);

    useEffect(() => {
        const timeout = setTimeout(() => {
            router.get(
                '/admin/tuition-posts',
                { status: status || undefined },
                { preserveState: true, replace: true }
            );
        }, 300);

        return () => clearTimeout(timeout);
    }, [status]);

    return (
        <>
            <Head title="Admin Tuition Posts" />

            <div className="space-y-6 p-4">
                <div>
                    <h1 className="text-2xl font-semibold">Tuition Posts</h1>
                    <p className="text-sm text-muted-foreground">All tuition posts across the platform.</p>
                </div>

                <div className="max-w-xs">
                    <label htmlFor="status" className="mb-2 block text-sm font-medium">
                        Filter by status
                    </label>
                    <Input
                        id="status"
                        list="tuition-post-statuses"
                        placeholder="All statuses"
                        value={status}
                        onChange={(event) => setStatus(event.target.value)}
                    />
                    <datalist id="tuition-post-statuses">
                        {statuses.map((status) => (
                            <option key={status} value={status} />
                        ))}
                    </datalist>
                </div>

                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/40">
                            <tr>
                                <th className="px-4 py-3 text-left">Title</th>
                                <th className="px-4 py-3 text-left">Tuition ID</th>
                                <th className="px-4 py-3 text-left">Guardian</th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3 text-left">Salary</th>
                                <th className="px-4 py-3 text-left">Students</th>
                                <th className="px-4 py-3 text-left">Applications</th>
                                <th className="px-4 py-3 text-left">Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {posts.length === 0 && (
                                <tr>
                                    <td className="px-4 py-6 text-muted-foreground" colSpan={8}>
                                        No posts found.
                                    </td>
                                </tr>
                            )}
                            {posts.map((post) => (
                                <tr key={post.id} className="border-t">
                                    <td className="px-4 py-3">
                                        <Link href={`/tuition-posts/${post.id}`} className="font-medium hover:underline">
                                            {post.title || `Tuition Post #${post.id}`}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs">{post.tuition_code ?? '-'}</td>
                                    <td className="px-4 py-3">
                                        {post.guardian ? (
                                            <div>
                                                <Link href={`/admin/guardians?email=${encodeURIComponent(post.guardian.email)}`} className="font-medium hover:underline">
                                                    {post.guardian.name}
                                                </Link>
                                                <p className="text-xs text-muted-foreground">
                                                    <Link href={`/admin/guardians?email=${encodeURIComponent(post.guardian.email)}`} className="hover:underline">
                                                        {post.guardian.email}
                                                    </Link>
                                                </p>
                                            </div>
                                        ) : (
                                            '-'
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[post.status] ?? 'bg-gray-100 text-gray-700'}`}
                                        >
                                            {post.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {post.salary_type === 'fixed' && post.salary_min ? `BDT ${post.salary_min}` : null}
                                        {post.salary_type === 'range' && post.salary_min && post.salary_max
                                            ? `BDT ${post.salary_min} - ${post.salary_max}`
                                            : null}
                                        {post.salary_type === 'negotiable' ? 'Negotiable' : null}
                                    </td>
                                    <td className="px-4 py-3">{post.students_count}</td>
                                    <td className="px-4 py-3">
                                        <Link href={`/admin/applications?tuition_code=${post.tuition_code ?? ''}`} className="font-medium text-blue-600 hover:underline">
                                            {post.applications_count}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3">{formatDate(post.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

AdminTuitionPostsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Tuition Posts',
            href: '/admin/tuition-posts',
        },
    ],
};
