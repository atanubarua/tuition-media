import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

type Post = {
    id: number;
    tuition_code: string | null;
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
    guardian: { id: number; name: string; email: string; phone?: string | null } | null;
    created_at: string;
};

type Props = {
    posts: {
        data: Post[];
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters: { status: string; tuition_code: string; guardian_name: string };
    statuses: string[];
};

const STATUS_STYLES: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700',
    published: 'bg-sky-100 text-sky-700',
    shortlisted: 'bg-violet-100 text-violet-700',
    assigned: 'bg-amber-100 text-amber-700',
    completed: 'bg-emerald-100 text-emerald-700',
    closed: 'bg-zinc-200 text-zinc-700',
    cancelled: 'bg-rose-100 text-rose-700',
};

export default function AdminTuitionPostsIndex({ posts, filters, statuses }: Props) {
    const formatDate = (value: string) => new Date(value).toISOString().slice(0, 10);
    const [status, setStatus] = useState(filters.status);
    const [tuitionCode, setTuitionCode] = useState(filters.tuition_code);
    const [guardianName, setGuardianName] = useState(filters.guardian_name);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        const timeout = setTimeout(() => {
            router.get(
                '/admin/tuition-posts',
                {
                    status: status || undefined,
                    tuition_code: tuitionCode || undefined,
                    guardian_name: guardianName || undefined,
                },
                { preserveState: true, replace: true, onFinish: () => setLoading(false) }
            );
        }, 300);

        return () => clearTimeout(timeout);
    }, [status, tuitionCode, guardianName]);

    return (
        <>
            <Head title="Admin Tuition Posts" />

            <div className="space-y-6 p-4">
                <div>
                    <h1 className="text-2xl font-semibold">Tuition Posts</h1>
                    <p className="text-sm text-muted-foreground">All tuition posts across the platform.</p>
                </div>

                <div className="rounded-lg border bg-card p-4">
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="relative flex-1 basis-64 min-w-[220px]">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="tuition_code"
                                value={tuitionCode}
                                onChange={(event) => setTuitionCode(event.target.value)}
                                placeholder="Search by tuition code"
                                className="pl-9"
                            />
                        </div>
                        <div className="relative flex-1 basis-64 min-w-[220px]">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="guardian_name"
                                value={guardianName}
                                onChange={(event) => setGuardianName(event.target.value)}
                                placeholder="Search by guardian name"
                                className="pl-9"
                            />
                        </div>
                        <div className="w-full sm:w-auto">
                            <Select value={status || 'all'} onValueChange={(value) => setStatus(value === 'all' ? '' : value)}>
                                <SelectTrigger id="status" className="w-full min-w-[180px]">
                                    <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <SelectValue placeholder="All statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All statuses</SelectItem>
                                    {statuses.map((itemStatus) => (
                                        <SelectItem key={itemStatus} value={itemStatus}>
                                            {itemStatus}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            type="button"
                            onClick={() => { setTuitionCode(''); setGuardianName(''); setStatus(''); }}
                            variant="outline"
                            disabled={!tuitionCode && !guardianName && !status}
                            title="Clear filters"
                        >
                            <X className="mr-2 h-4 w-4" />
                            Clear
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/40">
                            <tr>
                                <th className="px-4 py-3 text-left">Tuition ID</th>
                                <th className="px-4 py-3 text-left">Guardian</th>
                                <th className="px-4 py-3 text-left">Guardian Phone</th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3 text-left">Salary</th>
                                <th className="px-4 py-3 text-left">Students</th>
                                <th className="px-4 py-3 text-left">Applications</th>
                                <th className="px-4 py-3 text-left">Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && Array.from({ length: 8 }).map((_, i) => (
                                <tr key={i} className="border-t">
                                    {Array.from({ length: 8 }).map((_, j) => (
                                        <td key={j} className="px-4 py-3">
                                            <Skeleton className="h-4 w-full" />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                            {!loading && posts.data.length === 0 && (
                                <tr>
                                    <td className="px-4 py-6 text-muted-foreground" colSpan={8}>
                                        No posts found.
                                    </td>
                                </tr>
                            )}
                            {!loading && posts.data.map((post) => (
                                <tr key={post.id} className="border-t">
                                    <td className="px-4 py-3 font-mono text-xs">
                                        <Link href={`/admin/tuition-posts/${post.id}`} className="font-medium hover:underline">
                                            {post.tuition_code ?? `#${post.id}`}
                                        </Link>
                                    </td>
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
                                    <td className="px-4 py-3">{post.guardian?.phone ?? '-'}</td>
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

                {posts.links.length > 3 && (
                    <div className="flex flex-wrap items-center gap-2">
                        {posts.links.map((link, index) => (
                            <Link
                                key={`${link.label}-${index}`}
                                href={link.url ?? '#'}
                                preserveState
                                preserveScroll
                                className={`rounded border px-3 py-1 text-sm ${link.active ? 'bg-primary text-primary-foreground' : 'bg-background'} ${!link.url ? 'pointer-events-none opacity-50' : ''}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
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
