import { Head, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type TutorRequest = {
    id: number;
    request_group_id: string | null;
    status: 'pending' | 'contacted' | 'assigned' | 'rejected' | 'reviewed' | 'approved' | 'archived';
    class_level: string | null;
    academic_group: string | null;
    location: string | null;
    message: string | null;
    admin_note: string | null;
    created_at: string;
    student_count: number;
    tuition_post_id: number | null;
    assigned_tutor_id: number | null;
    assigned_at: string | null;
    students: Array<{
        id: number;
        class_level: string | null;
        academic_group: string | null;
        message: string | null;
    }>;
    guardian: { id: number; name: string; email: string | null; phone: string | null } | null;
    tutor: { id: number; name: string; email: string | null; phone: string | null; gender: string | null } | null;
};

type Props = {
    requests: {
        data: TutorRequest[];
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters: { status: string; tutor: string; guardian: string; location: string };
    statuses: TutorRequest['status'][];
};

function StatusBadge({ status }: { status: TutorRequest['status'] }) {
    const map: Record<TutorRequest['status'], string> = {
        pending:   'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
        reviewed:  'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
        contacted: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
        approved:  'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
        assigned:  'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
        rejected:  'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
        archived:  'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700',
    };

    return (
        <Badge className={`capitalize ${map[status] ?? ''}`} variant="outline">
            {status}
        </Badge>
    );
}

export default function AdminTutorRequestsIndex({ requests, filters, statuses }: Props) {
    const [status, setStatus] = useState(filters.status);
    const [tutor, setTutor] = useState(filters.tutor);
    const [guardian, setGuardian] = useState(filters.guardian);
    const [location, setLocation] = useState(filters.location);
    const [selected, setSelected] = useState<TutorRequest | null>(null);
    const [adminNote, setAdminNote] = useState('');
    const [nextStatus, setNextStatus] = useState<'pending' | 'contacted' | 'assigned' | 'rejected'>('pending');
    const hasMountedRef = useRef(false);

    useEffect(() => {
        if (!hasMountedRef.current) {
            hasMountedRef.current = true;
            return;
        }

        const timeout = setTimeout(() => {
            router.get('/admin/tutor-requests', {
                status: status || undefined,
                tutor: tutor.trim() || undefined,
                guardian: guardian.trim() || undefined,
                location: location.trim() || undefined,
            }, { preserveState: true, replace: true });
        }, 350);

        return () => clearTimeout(timeout);
    }, [status, tutor, guardian, location]);

    const openUpdate = (requestRow: TutorRequest) => {
        setSelected(requestRow);
        setAdminNote(requestRow.admin_note ?? '');
        const validStatuses = ['pending', 'contacted', 'assigned', 'rejected'] as const;
        const resolvedStatus = validStatuses.includes(requestRow.status as any) ? requestRow.status as typeof validStatuses[number] : 'pending';
        setNextStatus(resolvedStatus);
    };

    const save = () => {
        if (!selected) return;

        if (nextStatus === 'assigned' && !selected.tuition_post_id) {
            if (!selected.tutor) {
                alert('Please select a tutor before assigning this request.');
                return;
            }

            if (!confirm('Assigning will create a tuition post and internal application for this request. Continue?')) {
                return;
            }

            router.patch(`/admin/tutor-requests/${selected.id}/assign`, {
                admin_note: adminNote,
            }, {
                preserveScroll: true,
                onSuccess: () => setSelected(null),
            });

            return;
        }

        router.patch(`/admin/tutor-requests/${selected.id}`, {
            status: nextStatus,
            admin_note: adminNote,
        }, { preserveScroll: true, onSuccess: () => setSelected(null) });
    };

    return (
        <>
            <Head title="Tutor Requests" />
            <div className="space-y-4 p-4">
                <div>
                    <h1 className="text-2xl font-semibold">Tutor Requests</h1>
                    <p className="text-sm text-muted-foreground">Guardian requests submitted from the Find Tutors page.</p>
                </div>

                <Card className="p-4">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Status</Label>
                            <Select value={status || 'all'} onValueChange={(v) => setStatus(v === 'all' ? '' : v)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="All statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All statuses</SelectItem>
                                    {statuses.map((s) => (
                                        <SelectItem key={s} value={s}>
                                            <span className="capitalize">{s}</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Tutor</Label>
                            <Input placeholder="Name or phone..." value={tutor} onChange={(e) => setTutor(e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Guardian</Label>
                            <Input placeholder="Name or phone..." value={guardian} onChange={(e) => setGuardian(e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Location</Label>
                            <Input placeholder="Area, district..." value={location} onChange={(e) => setLocation(e.target.value)} />
                        </div>
                    </div>
                </Card>

                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    <th className="px-4 py-3 text-left">#</th>
                                    <th className="px-4 py-3 text-left">Guardian</th>
                                    <th className="px-4 py-3 text-left">Tutor</th>
                                    <th className="px-4 py-3 text-left">Location</th>
                                    <th className="px-4 py-3 text-left">Class / Group</th>
                                    <th className="px-4 py-3 text-center">Students</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-left">Date</th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {requests.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-10 text-center text-sm text-muted-foreground">
                                            No tutor requests found.
                                        </td>
                                    </tr>
                                ) : requests.data.map((requestRow) => (
                                    <tr key={requestRow.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{requestRow.id}</td>
                                        <td className="px-4 py-3">
                                            <p className="font-medium leading-tight">{requestRow.guardian?.name ?? '—'}</p>
                                            {requestRow.guardian?.phone && (
                                                <p className="text-xs text-muted-foreground">{requestRow.guardian.phone}</p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="font-medium leading-tight">{requestRow.tutor?.name ?? <span className="text-muted-foreground">—</span>}</p>
                                            {requestRow.tutor?.phone && (
                                                <p className="text-xs text-muted-foreground">{requestRow.tutor.phone}</p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {requestRow.location ?? '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col gap-0.5">
                                                {requestRow.students.map((s) => (
                                                    <span key={s.id} className="text-xs">
                                                        {s.class_level ? `Class ${s.class_level}` : '—'}
                                                        {s.academic_group && <span className="text-muted-foreground"> · {s.academic_group}</span>}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center font-medium">{requestRow.student_count}</td>
                                        <td className="px-4 py-3"><StatusBadge status={requestRow.status} /></td>
                                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                                            {new Date(requestRow.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Button variant="outline" size="sm" onClick={() => openUpdate(requestRow)}>Review</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
                    {selected && (
                        <>
                            {/* Header */}
                            <div className="flex items-start justify-between gap-4 px-6 py-5 border-b">
                                <div>
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                        <DialogTitle className="text-base font-semibold">Tutor Request #{selected.id}</DialogTitle>
                                        <StatusBadge status={selected.status} />
                                    </div>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        Submitted {new Date(selected.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        {selected.tuition_post_id && <span> · Tuition Post <span className="font-medium">#{selected.tuition_post_id}</span></span>}
                                    </p>
                                </div>
                            </div>

                            {/* Scrollable body */}
                            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

                                {/* Parties */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-lg border bg-muted/30 px-4 py-3 space-y-1">
                                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tutor</p>
                                        <p className="text-sm font-semibold">{selected.tutor?.name ?? <span className="text-muted-foreground font-normal">Not assigned</span>}</p>
                                        {selected.tutor?.email && <p className="text-xs text-muted-foreground">{selected.tutor.email}</p>}
                                        {selected.tutor?.phone && <p className="text-xs text-muted-foreground">{selected.tutor.phone}</p>}
                                    </div>
                                    <div className="rounded-lg border bg-muted/30 px-4 py-3 space-y-1">
                                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Guardian</p>
                                        <p className="text-sm font-semibold">{selected.guardian?.name ?? '—'}</p>
                                        {selected.guardian?.email && <p className="text-xs text-muted-foreground">{selected.guardian.email}</p>}
                                        {selected.guardian?.phone && <p className="text-xs text-muted-foreground">{selected.guardian.phone}</p>}
                                    </div>
                                </div>

                                {/* Meta strip */}
                                <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm flex flex-wrap items-center gap-x-4 gap-y-1">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-muted-foreground">Location:</span>
                                        <span className="font-medium">{selected.location ?? '—'}</span>
                                    </div>
                                    <span className="text-muted-foreground/40">·</span>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-muted-foreground">Students:</span>
                                        <span className="font-medium">{selected.student_count}</span>
                                    </div>
                                    {selected.assigned_at && (
                                        <>
                                            <span className="text-muted-foreground/40">·</span>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-muted-foreground">Assigned:</span>
                                                <span className="font-medium">{new Date(selected.assigned_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Students */}
                                <div className="space-y-2">
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Students</p>
                                    <div className="space-y-2">
                                        {selected.students.map((student, index) => (
                                            <div key={student.id} className="flex gap-3 rounded-lg border bg-background px-3 py-2.5">
                                                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                                                    {index + 1}
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium">
                                                        {student.class_level ? `Class ${student.class_level}` : 'No class'}
                                                        {student.academic_group && <span className="text-muted-foreground font-normal"> · {student.academic_group}</span>}
                                                    </p>
                                                    {student.message && (
                                                        <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{student.message}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <Separator />

                                {/* Admin actions */}
                                <div className="space-y-4">
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Admin Actions</p>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="request-status">Status</Label>
                                        <Select value={nextStatus} onValueChange={(v) => setNextStatus(v as 'pending' | 'contacted' | 'assigned' | 'rejected')}>
                                            <SelectTrigger id="request-status" className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {statuses.map((s) => (
                                                    <SelectItem key={s} value={s}>
                                                        <span className="capitalize">{s}</span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="admin-note">Internal note</Label>
                                            <span className="text-xs text-muted-foreground">{adminNote.length} / 1000</span>
                                        </div>
                                        <textarea
                                            id="admin-note"
                                            value={adminNote}
                                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAdminNote(e.target.value)}
                                            maxLength={1000}
                                            rows={3}
                                            placeholder="Optional internal note visible only to admins…"
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-end gap-2 border-t px-6 py-4">
                                <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
                                <Button onClick={save}>Save changes</Button>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
