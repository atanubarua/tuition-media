import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { dashboard } from '@/routes';

type Application = {
    id: number;
    status: 'pending' | 'shortlisted' | 'interested' | 'not_interested' | 'rejected' | 'hired';
    expected_salary: number | null;
    created_at: string;
    post: { id: number | null; tuition_code: string | null; title: string | null; status: string | null };
};

type Props = {
    applications: {
        data: Application[];
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters: { status?: string; search?: string };
};

const STATUS_STYLES: Record<Application['status'], string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    shortlisted: 'bg-blue-100 text-blue-700',
    interested: 'bg-emerald-100 text-emerald-700',
    not_interested: 'bg-rose-100 text-rose-700',
    rejected: 'bg-red-100 text-red-700',
    hired: 'bg-green-100 text-green-700',
};

export default function TutorApplicationsIndex({ applications, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [statusFilter, setStatusFilter] = useState(filters.status ?? 'all');
    const [loading, setLoading] = useState(false);
    const hasMountedRef = useRef(false);

    useEffect(() => {
        if (!hasMountedRef.current) {
            hasMountedRef.current = true;
            return;
        }

        setLoading(true);
        const timeout = setTimeout(() => {
            router.get(
                '/tutor/applications',
                {
                    status: statusFilter !== 'all' ? statusFilter : undefined,
                    search: search || undefined,
                },
                { preserveState: true, replace: true, onFinish: () => setLoading(false) },
            );
        }, 300);

        return () => clearTimeout(timeout);
    }, [search, statusFilter]);

    return (
        <>
            <Head title="My Applications" />
            <div className="space-y-4 p-4 md:p-6">
                <h1 className="text-2xl font-semibold">My Applications</h1>

                <div className="flex items-center gap-3">
                    <div className="grid flex-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
                        <div className="xl:col-span-3">
                            <Input
                                placeholder="Search by title or tuition code"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="All statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All statuses</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="shortlisted">Shortlisted</SelectItem>
                                    <SelectItem value="interested">Interested</SelectItem>
                                    <SelectItem value="not_interested">Not interested</SelectItem>
                                    <SelectItem value="hired">Hired</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {(search || statusFilter !== 'all') && (
                        <button
                            type="button"
                            onClick={() => { setSearch(''); setStatusFilter('all'); }}
                            className="flex h-10 shrink-0 items-center gap-1.5 rounded-md border px-3 text-sm text-muted-foreground hover:bg-muted"
                            title="Clear filters"
                        >
                            <X className="h-4 w-4" />
                            Clear
                        </button>
                    )}
                </div>

                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/40">
                            <tr>
                                <th className="px-4 py-3 text-left">Tuition Code</th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3 text-left">Expected Salary</th>
                                <th className="px-4 py-3 text-left">Applied On</th>
                                <th className="px-4 py-3 text-left">Post State</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <tr key={i} className="border-t">
                                        {Array.from({ length: 5 }).map((_, j) => (
                                            <td key={j} className="px-4 py-3">
                                                <Skeleton className="h-4 w-full" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : applications.data.length === 0 ? (
                                <tr className="border-t">
                                    <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                                        No applications found.
                                    </td>
                                </tr>
                            ) : (
                                applications.data.map((app) => (
                                    <tr key={app.id} className="border-t">
                                        <td className="px-4 py-3 font-mono text-xs">{app.post.tuition_code ?? '-'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[app.status]}`}>
                                                {app.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {app.expected_salary ? `BDT ${app.expected_salary.toLocaleString()}` : '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {new Date(app.created_at).toLocaleDateString('en-BD', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                            })}
                                        </td>
                                        <td className="px-4 py-3 capitalize">{app.post.status ?? '-'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {applications.links.length > 3 && (
                    <div className="flex flex-wrap items-center gap-2">
                        {applications.links.map((link, index) => (
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

TutorApplicationsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard.url() },
        { title: 'My Applications', href: '/tutor/applications' },
    ],
};
