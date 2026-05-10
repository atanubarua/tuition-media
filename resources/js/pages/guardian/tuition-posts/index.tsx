import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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
};

type Props = {
    posts: Post[];
    filters: { tuition_code: string; status: string };
    statuses: string[];
};

const STATUS_STYLES: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700 border-slate-200',
    published: 'bg-sky-100 text-sky-700 border-sky-200',
    shortlisted: 'bg-amber-100 text-amber-700 border-amber-200',
    assigned: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    closed: 'bg-zinc-200 text-zinc-700 border-zinc-300',
    cancelled: 'bg-rose-100 text-rose-700 border-rose-200',
};

export default function TuitionPostIndex({ posts, filters, statuses }: Props) {
    const [tuitionCode, setTuitionCode] = useState(filters.tuition_code ?? '');
    const [status, setStatus] = useState(filters.status ?? '');

    useEffect(() => {
        const timeout = setTimeout(() => {
            router.get(
                '/guardian/tuition-posts',
                {
                    tuition_code: tuitionCode || undefined,
                    status: status || undefined,
                },
                { preserveState: true, replace: true }
            );
        }, 300);

        return () => clearTimeout(timeout);
    }, [tuitionCode, status]);

    const handleDelete = (id: number) => {
        if (!confirm('Are you sure you want to delete this tuition post?')) {
            return;
        }

        router.delete(`/guardian/tuition-posts/${id}`);
    };

    return (
        <>
            <Head title="My Tuition Posts" />

            <div className="space-y-6 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">My Tuition Posts</h1>
                        <p className="text-sm text-muted-foreground">Manage your posted tuition jobs.</p>
                    </div>
                    <Button asChild>
                        <Link href="/guardian/tuition-posts/create">Post Tuition Job</Link>
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label htmlFor="tuition_code" className="mb-2 block text-sm font-medium">
                            Search by tuition code
                        </label>
                        <Input
                            id="tuition_code"
                            placeholder="e.g. TID7K9M2Q"
                            value={tuitionCode}
                            onChange={(event) => setTuitionCode(event.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="status" className="mb-2 block text-sm font-medium">
                            Filter by status
                        </label>
                        <select
                            id="status"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={status}
                            onChange={(event) => setStatus(event.target.value)}
                        >
                            <option value="">All statuses</option>
                            {statuses.map((statusOption) => (
                                <option key={statusOption} value={statusOption}>
                                    {statusOption.charAt(0).toUpperCase() + statusOption.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/40">
                            <tr>
                                <th className="px-4 py-3 text-left">Tuition Code</th>
                                <th className="px-4 py-3 text-left">Title</th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3 text-left">Salary</th>
                                <th className="px-4 py-3 text-left">Days/Week</th>
                                <th className="px-4 py-3 text-left">Students</th>
                                <th className="px-4 py-3 text-left">Applications</th>
                                <th className="px-4 py-3 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {posts.length === 0 && (
                                <tr>
                                    <td className="px-4 py-6 text-muted-foreground" colSpan={8}>
                                        No tuition post yet.
                                    </td>
                                </tr>
                            )}
                            {posts.map((post) => (
                                <tr key={post.id} className="border-t">
                                    <td className="px-4 py-3 font-mono text-xs">{post.tuition_code ?? '-'}</td>
                                    <td className="px-4 py-3">{post.title || `Tuition Post #${post.id}`}</td>
                                    <td className="px-4 py-3">
                                        <Badge variant="outline" className={`${STATUS_STYLES[post.status] ?? 'bg-gray-100 text-gray-700 border-gray-200'} capitalize`}>
                                            {post.status}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                        {post.salary_type === 'fixed' && post.salary_min ? `BDT ${post.salary_min}` : null}
                                        {post.salary_type === 'range' && post.salary_min && post.salary_max
                                            ? `BDT ${post.salary_min} - ${post.salary_max}`
                                            : null}
                                        {post.salary_type === 'negotiable' ? 'Negotiable' : null}
                                    </td>
                                    <td className="px-4 py-3">{post.days_per_week}</td>
                                    <td className="px-4 py-3">{post.students_count}</td>
                                    <td className="px-4 py-3">
                                        <Link
                                            href={`/guardian/tuition-posts/${post.id}/applications`}
                                            className="text-blue-600 hover:underline font-medium"
                                        >
                                            {post.applications_count} application{post.applications_count !== 1 ? 's' : ''}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1">
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="ghost" size="icon" asChild>
                                                        <Link href={`/tuition-posts/${post.id}`}>
                                                            <Eye className="size-4" />
                                                        </Link>
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>View details</TooltipContent>
                                            </Tooltip>

                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="ghost" size="icon" asChild>
                                                        <Link href={`/guardian/tuition-posts/${post.id}/edit`}>
                                                            <Pencil className="size-4" />
                                                        </Link>
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Edit</TooltipContent>
                                            </Tooltip>

                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(post.id)}>
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Delete</TooltipContent>
                                            </Tooltip>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

TuitionPostIndex.layout = {
    breadcrumbs: [
        {
            title: 'My Tuition Posts',
            href: '/guardian/tuition-posts',
        },
    ],
};
