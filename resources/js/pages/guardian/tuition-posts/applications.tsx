import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Info, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { dashboard } from '@/routes';

type TutorProfile = {
    university: string | null;
    department: string | null;
    academic_year: number | null;
    intake_year: number | null;
    occupation: string | null;
    job_title: string | null;
    job_organization: string | null;
    teachable_levels: string[];
    teachable_mediums: string[];
    experience_months: number;
    subjects: string[];
    bio: string | null;
};

type Tutor = {
    id: number;
    name: string;
    gender: string | null;
    profile: TutorProfile | null;
};

type Application = {
    id: number;
    status: 'pending' | 'shortlisted' | 'interested' | 'not_interested' | 'rejected' | 'hired';
    cover_note: string | null;
    expected_salary: number | null;
    created_at: string;
    tutor: Tutor;
};

type Post = { id: number; title: string | null; salary_type: string | null };

type PaginationLink = { url: string | null; label: string; active: boolean };

type PaginatedApplications = {
    data: Application[];
    links: PaginationLink[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
};

type Filters = {
    status: string;
    search: string;
    university: string;
};

const STATUS_STYLES: Record<Application['status'], string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    shortlisted: 'bg-blue-100 text-blue-700',
    interested: 'bg-emerald-100 text-emerald-700',
    not_interested: 'bg-rose-100 text-rose-700',
    rejected: 'bg-red-100 text-red-700',
    hired: 'bg-green-100 text-green-700',
};

function experienceLabel(months: number): string {
    if (months === 0) {
        return 'No experience';
    }

    const y = Math.floor(months / 12);
    const m = months % 12;

    return [y > 0 && `${y}yr`, m > 0 && `${m}mo`].filter(Boolean).join(' ');
}

function formatDate(value: string): string {
    return new Date(value).toISOString().slice(0, 10);
}

export default function GuardianApplicationsIndex({
    post,
    applications,
    filters,
    universities,
}: {
    post: Post;
    applications: PaginatedApplications;
    filters: Filters;
    universities: string[];
}) {
    const [status, setStatus] = useState(filters.status ?? '');
    const [search, setSearch] = useState(filters.search ?? '');
    const [university, setUniversity] = useState(filters.university ?? '');
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const hasMountedRef = useRef(false);

    const clearFilters = () => {
        setStatus('');
        setSearch('');
        setUniversity('');
    };

    useEffect(() => {
        if (!hasMountedRef.current) {
            hasMountedRef.current = true;
            return;
        }

        setIsLoading(true);
        const timeout = setTimeout(() => {
            router.get(
                `/guardian/tuition-posts/${post.id}/applications`,
                {
                    status: status || undefined,
                    search: search || undefined,
                    university: university || undefined,
                },
                { preserveState: true, replace: true, onFinish: () => setIsLoading(false) }
            );
        }, 300);

        return () => clearTimeout(timeout);
    }, [status, search, university, post.id]);

    function updateStatus(appId: number, nextStatus: 'pending' | 'shortlisted' | 'rejected') {
        router.patch(`/guardian/tuition-posts/${post.id}/applications/${appId}`, { status: nextStatus }, { preserveScroll: true });
    }

    return (
        <>
            <Head title="Applications" />
            {selectedApp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedApp(null)}>
                    <div className="absolute inset-0 bg-black/40" />
                    <div
                        className="relative z-10 max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border bg-card shadow-xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="flex items-start justify-between border-b p-5">
                            <div>
                                <h2 className="text-lg font-semibold">{selectedApp.tutor.name}</h2>
                                <p className="text-sm text-muted-foreground">{selectedApp.tutor.gender ?? '-'}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedApp(null)}
                                className="text-xl leading-none text-muted-foreground hover:text-foreground"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="space-y-5 p-5 text-sm">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-muted-foreground">University</p>
                                    <p className="font-medium">{selectedApp.tutor.profile?.university ?? '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Department</p>
                                    <p className="font-medium">{selectedApp.tutor.profile?.department ?? '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Experience</p>
                                    <p className="font-medium">
                                        {selectedApp.tutor.profile ? experienceLabel(selectedApp.tutor.profile.experience_months) : '-'}
                                    </p>
                                </div>
                                {post.salary_type !== 'fixed' && (
                                    <div>
                                        <p className="text-xs text-muted-foreground">Expected Salary</p>
                                        <p className="font-medium">
                                            {selectedApp.expected_salary ? `BDT ${selectedApp.expected_salary.toLocaleString()}` : '-'}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {selectedApp.tutor.profile?.subjects && selectedApp.tutor.profile.subjects.length > 0 && (
                                <div>
                                    <p className="mb-1.5 text-xs text-muted-foreground">Subjects</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedApp.tutor.profile.subjects.map((subject) => (
                                            <span key={subject} className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs text-blue-700">
                                                {subject}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedApp.tutor.profile?.bio && (
                                <div>
                                    <p className="mb-1 text-xs text-muted-foreground">Bio</p>
                                    <p className="whitespace-pre-line text-muted-foreground">{selectedApp.tutor.profile.bio}</p>
                                </div>
                            )}

                            {selectedApp.cover_note && (
                                <div>
                                    <p className="mb-1 text-xs text-muted-foreground">Cover Note</p>
                                    <p className="whitespace-pre-line rounded-lg bg-muted/40 px-3 py-2">{selectedApp.cover_note}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="w-full space-y-5 p-4 md:p-6">
                <section className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm md:p-5">
                    <div className="flex flex-wrap items-center gap-3">
                        <Button type="button" variant="outline" size="icon" asChild className="bg-white">
                            <Link href="/guardian/tuition-posts" aria-label="Back to My Tuition Posts">
                                <ArrowLeft className="size-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight">Applications</h1>
                            <p className="text-sm text-muted-foreground">{post.title ?? `Tuition Post #${post.id}`}</p>
                        </div>
                    </div>

                    <div className="mt-4 flex items-start gap-3 rounded-lg border border-blue-200/80 bg-blue-50/80 px-3.5 py-3 text-sm text-blue-800">
                        <Info className="mt-0.5 size-4 shrink-0 text-blue-600" />
                        <p>
                            Shortlist up to <span className="font-semibold">5 tutors</span>. Then our admin team will review your shortlisted
                            tutors and select the best one.
                        </p>
                    </div>
                </section>

                <div className="flex items-end gap-4">
                <div className="grid flex-1 gap-3 md:grid-cols-3">
                    <div>
                        <label htmlFor="search" className="mb-2 block text-sm font-medium">
                            Search tutor
                        </label>
                        <Input
                            id="search"
                            placeholder="Tutor name"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </div>

                    <div>
                        <label htmlFor="status" className="mb-2 block text-sm font-medium">
                            Status
                        </label>
                        <select
                            id="status"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={status}
                            onChange={(event) => setStatus(event.target.value)}
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

                    <div>
                        <label htmlFor="university" className="mb-2 block text-sm font-medium">
                            University
                        </label>
                        <select
                            id="university"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={university}
                            onChange={(event) => setUniversity(event.target.value)}
                        >
                            <option value="">All universities</option>
                            {universities.map((u) => (
                                <option key={u} value={u}>
                                    {u}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                    {(search || status || university) && (
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="mb-0.5 flex h-10 shrink-0 items-center gap-1.5 self-end rounded-md border px-3 text-sm text-muted-foreground hover:bg-muted"
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
                                <th className="px-4 py-3 text-left">Tutor</th>
                                <th className="px-4 py-3 text-left">University</th>
                                <th className="px-4 py-3 text-left">Department</th>
                                <th className="px-4 py-3 text-left">Experience</th>
                                {post.salary_type !== 'fixed' && <th className="px-4 py-3 text-left">Expected Salary</th>}
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3 text-left">Applied</th>
                                <th className="px-4 py-3 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="border-t">
                                        {Array.from({ length: post.salary_type !== 'fixed' ? 8 : 7 }).map((_, j) => (
                                            <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                                        ))}
                                    </tr>
                                ))
                            ) : applications.data.length === 0 ? (
                                <tr>
                                    <td colSpan={post.salary_type !== 'fixed' ? 8 : 7} className="px-4 py-6 text-muted-foreground">
                                        No applications found.
                                    </td>
                                </tr>
                            ) : applications.data.map((app) => (
                                <tr key={app.id} className="border-t align-top">
                                    <td className="px-4 py-3">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedApp(app)}
                                            className="font-medium text-left hover:text-blue-600 hover:underline"
                                        >
                                            {app.tutor.name}
                                        </button>
                                        <p className="text-xs text-muted-foreground">{app.tutor.gender ?? '-'}</p>
                                    </td>
                                    <td className="px-4 py-3">{app.tutor.profile?.university ?? '-'}</td>
                                    <td className="px-4 py-3">{app.tutor.profile?.department ?? '-'}</td>
                                    <td className="px-4 py-3">{app.tutor.profile ? experienceLabel(app.tutor.profile.experience_months) : '-'}</td>
                                    {post.salary_type !== 'fixed' && <td className="px-4 py-3">{app.expected_salary ? `BDT ${app.expected_salary.toLocaleString()}` : '-'}</td>}
                                    <td className="px-4 py-3">
                                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[app.status]}`}>
                                            {app.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">{formatDate(app.created_at)}</td>
                                    <td className="px-4 py-3">
                                        {app.status === 'pending' ? (
                                            <div className="flex min-w-[108px] flex-col gap-2">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        if (confirm('Shortlist this application?')) {
                                                            updateStatus(app.id, 'shortlisted');
                                                        }
                                                    }}
                                                    className="h-9 justify-center border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
                                                >
                                                    Shortlist
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        if (confirm('Reject this application?')) {
                                                            updateStatus(app.id, 'rejected');
                                                        }
                                                    }}
                                                    className="h-9 justify-center border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
                                                >
                                                    Reject
                                                </Button>
                                            </div>
                                        ) : app.status === 'shortlisted' ? (
                                            <div className="flex min-w-[108px] flex-col gap-2">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        if (confirm('Remove from shortlist and move back to pending?')) {
                                                            updateStatus(app.id, 'pending');
                                                        }
                                                    }}
                                                    className="h-9 justify-center border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-800"
                                                >
                                                    Un-shortlist
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        if (confirm('Reject this application?')) {
                                                            updateStatus(app.id, 'rejected');
                                                        }
                                                    }}
                                                    className="h-9 justify-center border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
                                                >
                                                    Reject
                                                </Button>
                                            </div>
                                        ) : app.status === 'interested' || app.status === 'not_interested' ? (
                                            <span className="text-xs text-blue-600">Admin contacted tutor</span>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">-</span>
                                        )}
                                    </td>
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
                                    className={`rounded-md border px-3 py-1.5 text-sm ${
                                        link.active ? 'border-blue-600 bg-blue-50 text-blue-700' : 'hover:bg-muted'
                                    } ${link.url ? '' : 'pointer-events-none opacity-50'}`}
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

GuardianApplicationsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard.url() },
        { title: 'My Tuition Posts', href: '/guardian/tuition-posts' },
        { title: 'Applications', href: '#' },
    ],
};
