import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { dashboard } from '@/routes';

type Student = {
    class_level: string | null;
    academic_group: string | null;
};

type TutorRequestGroup = {
    id: number;
    request_group_id: string | null;
    status: 'pending' | 'contacted' | 'assigned' | 'rejected';
    location: string | null;
    created_at: string;
    tuition_post_id: number | null;
    assigned_at: string | null;
    students: Student[];
    tutor: { id: number; name: string; gender: string | null } | null;
};

type PaginationLink = { url: string | null; label: string; active: boolean };

type Props = {
    requests: {
        data: TutorRequestGroup[];
        links: PaginationLink[];
        from: number | null;
        to: number | null;
        total: number;
        last_page: number;
    };
    filters: { status: string; tutor: string };
    statuses: string[];
};

const STATUS_STYLES: Record<TutorRequestGroup['status'], string> = {
    pending:   'bg-yellow-100 text-yellow-700',
    contacted: 'bg-blue-100 text-blue-700',
    assigned:  'bg-emerald-100 text-emerald-700',
    rejected:  'bg-red-100 text-red-700',
};

function formatClassLevel(student: Student): string {
    const level = student.class_level ?? '-';
    const prefix = isNaN(Number(level)) ? '' : 'Class ';
    const group = student.academic_group ? ` (${student.academic_group})` : '';
    return `${prefix}${level.charAt(0).toUpperCase() + level.slice(1)}${group}`;
}

export default function GuardianTutorRequestsIndex({ requests, filters, statuses }: Props) {
    const [status, setStatus] = useState(filters.status ?? '');
    const [tutor, setTutor]   = useState(filters.tutor ?? '');
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
                '/guardian/tutor-requests',
                { status: status || undefined, tutor: tutor || undefined },
                { preserveState: true, replace: true, onFinish: () => setLoading(false) },
            );
        }, 300);

        return () => clearTimeout(timeout);
    }, [status, tutor]);

    const hasFilters = status || tutor;

    return (
        <>
            <Head title="My Tutor Requests" />

            <div className="w-full space-y-5 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl font-semibold">My Tutor Requests</h1>
                    <p className="text-sm text-muted-foreground">Tutors you have requested through Find Tutors.</p>
                </div>

                <div className="flex items-end gap-4">
                    <div className="grid flex-1 gap-3 md:grid-cols-2">
                        <div>
                            <label htmlFor="tutor" className="mb-2 block text-sm font-medium">Tutor name</label>
                            <Input
                                id="tutor"
                                placeholder="Search by tutor name"
                                value={tutor}
                                onChange={(e) => setTutor(e.target.value)}
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
                                {statuses.map((s) => (
                                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    {hasFilters && (
                        <button
                            type="button"
                            onClick={() => { setTutor(''); setStatus(''); }}
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
                                <th className="px-4 py-3 text-left">Students / Class</th>
                                <th className="px-4 py-3 text-left">Location</th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3 text-left">Tuition Post</th>
                                <th className="px-4 py-3 text-left">Submitted</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="border-t">
                                        {Array.from({ length: 6 }).map((_, j) => (
                                            <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                                        ))}
                                    </tr>
                                ))
                            ) : requests.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                        No tutor requests found.
                                    </td>
                                </tr>
                            ) : requests.data.map((req) => (
                                <tr key={req.id} className="border-t align-top">
                                    <td className="px-4 py-3">
                                        <p className="font-medium">{req.tutor?.name ?? '-'}</p>
                                        {req.tutor?.gender && (
                                            <p className="text-xs capitalize text-muted-foreground">{req.tutor.gender}</p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <ul className="space-y-0.5">
                                            {req.students.map((s, i) => (
                                                <li key={i} className="text-xs text-muted-foreground">{formatClassLevel(s)}</li>
                                            ))}
                                        </ul>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">{req.location ?? '-'}</td>
                                    <td className="px-4 py-3">
                                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[req.status]}`}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {req.tuition_post_id ? (
                                            <Link
                                                href={`/guardian/tuition-posts/${req.tuition_post_id}/applications`}
                                                className="text-blue-600 hover:underline"
                                            >
                                                View post
                                            </Link>
                                        ) : (
                                            <span className="text-muted-foreground">—</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {new Date(req.created_at).toISOString().slice(0, 10)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <p className="text-sm text-muted-foreground">
                        Showing {requests.from ?? 0}–{requests.to ?? 0} of {requests.total}
                    </p>
                    {requests.last_page > 1 && (
                        <div className="flex flex-wrap gap-2">
                            {requests.links.map((link, i) => (
                                <Link
                                    key={`${link.label}-${i}`}
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

GuardianTutorRequestsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard.url() },
        { title: 'My Tutor Requests', href: '/guardian/tutor-requests' },
    ],
};
