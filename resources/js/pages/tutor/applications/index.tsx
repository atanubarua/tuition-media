import { Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { dashboard } from '@/routes';

type Application = {
    id: number;
    status: 'pending' | 'shortlisted' | 'interested' | 'not_interested' | 'rejected' | 'hired';
    expected_salary: number | null;
    created_at: string;
    post: { id: number | null; tuition_code: string | null; title: string | null; status: string | null };
};

const STATUS_STYLES: Record<Application['status'], string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    shortlisted: 'bg-blue-100 text-blue-700',
    interested: 'bg-emerald-100 text-emerald-700',
    not_interested: 'bg-rose-100 text-rose-700',
    rejected: 'bg-red-100 text-red-700',
    hired: 'bg-green-100 text-green-700',
};

export default function TutorApplicationsIndex({ applications }: { applications: Application[] }) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | Application['status']>('all');

    const filteredApplications = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        return applications.filter((app) => {
            if (statusFilter !== 'all' && app.status !== statusFilter) {
                return false;
            }

            if (normalizedSearch) {
                const searchable = [
                    app.post.title ?? '',
                    app.post.tuition_code ?? '',
                    app.post.id ? String(app.post.id) : '',
                ]
                    .join(' ')
                    .toLowerCase();

                if (!searchable.includes(normalizedSearch)) {
                    return false;
                }
            }

            return true;
        });
    }, [applications, search, statusFilter]);

    const resetFilters = () => {
        setSearch('');
        setStatusFilter('all');
    };

    return (
        <>
            <Head title="My Applications" />
            <div className="p-4 md:p-6 space-y-4">
                <h1 className="text-2xl font-semibold">My Applications</h1>

                {applications.length === 0 ? (
                    <p className="text-muted-foreground text-sm">You haven't applied for any tuitions yet.</p>
                ) : (
                    <div className="space-y-4">
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                            <div className="xl:col-span-3">
                                <Input
                                    placeholder="Search by title or tuition code"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                />
                            </div>
                            <div>
                                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | Application['status'])}>
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

                        <div className="flex justify-end">
                            <Button variant="outline" onClick={resetFilters}>
                                Reset Filters
                            </Button>
                        </div>

                        <div className="overflow-x-auto rounded-lg border">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/40">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Tuition</th>
                                        <th className="px-4 py-3 text-left">Tuition Code</th>
                                        <th className="px-4 py-3 text-left">Status</th>
                                        <th className="px-4 py-3 text-left">Expected Salary</th>
                                        <th className="px-4 py-3 text-left">Applied On</th>
                                        <th className="px-4 py-3 text-left">Post State</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredApplications.length === 0 ? (
                                        <tr className="border-t">
                                            <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                                                No applications match your filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredApplications.map((app) => (
                                            <tr key={app.id} className="border-t">
                                                <td className="px-4 py-3">
                                                    {app.post.id && app.post.status === 'published' ? (
                                                        <Link href={`/tuition-posts/${app.post.id}`} className="font-medium hover:text-blue-600">
                                                            {app.post.title ?? `Tuition #${app.post.id}`}
                                                        </Link>
                                                    ) : (
                                                        <p className="font-medium">{app.post.title ?? `Tuition #${app.post.id ?? app.id}`}</p>
                                                    )}
                                                </td>
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
