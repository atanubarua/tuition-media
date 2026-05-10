import { Head, Link, router } from '@inertiajs/react';
import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { dashboard } from '@/routes';

type Application = {
    id: number;
    status: 'pending' | 'shortlisted' | 'interested' | 'not_interested' | 'rejected' | 'hired';
    expected_salary: number | null;
    created_at: string;
    post: { id: number | null; title: string | null };
    tutor: { id: number; name: string; gender: string | null; university: string | null; department: string | null };
};

type PaginationLink = { url: string | null; label: string; active: boolean };

type PaginatedApplications = {
    data: Application[];
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
    last_page: number;
};

type Filters = { status: string; search: string };

const STATUS_STYLES: Record<Application['status'], string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    shortlisted: 'bg-blue-100 text-blue-700',
    interested: 'bg-emerald-100 text-emerald-700',
    not_interested: 'bg-rose-100 text-rose-700',
    rejected: 'bg-red-100 text-red-700',
    hired: 'bg-green-100 text-green-700',
};

export default function GuardianAllApplications({
    applications,
    filters,
}: {
    applications: PaginatedApplications;
    filters: Filters;
}) {
    const [status, setStatus] = useState(filters.status ?? '');
    const [search, setSearch] = useState(filters.search ?? '');
    const [isLoading, setIsLoading] = useState(false);
    const hasMountedRef = useRef(false);

    useEffect(() => {
        if (!hasMountedRef.current) {
            hasMountedRef.current = true;
            return;
        }

        setIsLoading(true);
        const timeout = setTimeout(() => {
            router.get(
                '/guardian/applications',
                { status: status || undefined, search: search || undefined },
                { preserveState: true, replace: true, onFinish: () => setIsLoading(false) }
            );
        }, 300);

        return () => clearTimeout(timeout);
    }, [status, search]);

    return (
        <>
            <Head title="All Applications" />

            <div className="w-full space-y-5 p-4 md:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold">All Applications</h1>
                        <p className="text-sm text-muted-foreground">Applications received across all your tuition posts.</p>
                    </div>
                </div>

                <div className="flex items-end gap-4">
                    <div className="grid flex-1 gap-3 md:grid-cols-2">
                        <div>
                            <label htmlFor="search" className="mb-2 block text-sm font-medium">Search tutor</label>
                            <Input
                                id="search"
                                placeholder="Tutor name"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="status" className="mb-2 block text-sm font-medium">Status</label>
                            <select
                                id="status"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                            >
                                <option value="">All statuses</option>
                                <option value="pending">Pending</option>
                                <option value="shortlisted">Shortlisted</option>
                                <option value="interested">Interested</option>
                                <option value="not_interested">Not interested</option>
                                <option value="rejected">Rejected</option>
                                <option value="hired">Hired</option>
                            </select>
                        </div>
                    </div>
                    {(search || status) && (
                        <button
                            type="button"
                            onClick={() => { setSearch(''); setStatus(''); }}
                            className="mb-0.5 flex h-10 shrink-0 items-center gap-1.5 self-end rounded-md border px-3 text-sm text-muted-foreground hover:bg-muted"
                        >
                            <X className="h-4 w-4" /> Clear
                        </button>
                    )}
                </div>

                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/40">
                            <tr>
                                <th className="px-4 py-3 text-left">Tutor</th>
                                <th className="px-4 py-3 text-left">University</th>
                                <th className="px-4 py-3 text-left">Department</th>
                                <th className="px-4 py-3 text-left">Post</th>
                                <th className="px-4 py-3 text-left">Expected Salary</th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3 text-left">Applied</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="border-t">
                                        {Array.from({ length: 7 }).map((_, j) => (
                                            <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                                        ))}
                                    </tr>
                                ))
                            ) : applications.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-6 text-muted-foreground">No applications found.</td>
                                </tr>
                            ) : applications.data.map((app) => (
                                <tr key={app.id} className="border-t align-top">
                                    <td className="px-4 py-3">
                                        <p className="font-medium">{app.tutor.name}</p>
                                        <p className="text-xs text-muted-foreground">{app.tutor.gender ?? '-'}</p>
                                    </td>
                                    <td className="px-4 py-3">{app.tutor.university ?? '-'}</td>
                                    <td className="px-4 py-3">{app.tutor.department ?? '-'}</td>
                                    <td className="px-4 py-3">
                                        {app.post.id ? (
                                            <Link href={`/guardian/tuition-posts/${app.post.id}/applications`} className="hover:text-blue-600 hover:underline">
                                                {app.post.title ?? `Post #${app.post.id}`}
                                            </Link>
                                        ) : '-'}
                                    </td>
                                    <td className="px-4 py-3">{app.expected_salary ? `BDT ${app.expected_salary.toLocaleString()}` : '-'}</td>
                                    <td className="px-4 py-3">
                                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[app.status]}`}>
                                            {app.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">{new Date(app.created_at).toISOString().slice(0, 10)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <p className="text-sm text-muted-foreground">
                        Showing {applications.from ?? 0} to {applications.to ?? 0} of {applications.total}
                    </p>
                    {applications.last_page > 1 && (
                        <div className="flex flex-wrap gap-2">
                            {applications.links.map((link, index) => (
                                <Link
                                    key={`${link.label}-${index}`}
                                    href={link.url ?? '#'}
                                    preserveState
                                    preserveScroll
                                    className={`rounded-md border px-3 py-1.5 text-sm ${link.active ? 'border-blue-600 bg-blue-50 text-blue-700' : 'hover:bg-muted'} ${link.url ? '' : 'pointer-events-none opacity-50'}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

GuardianAllApplications.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard.url() },
        { title: 'All Applications', href: '/guardian/applications' },
    ],
};
