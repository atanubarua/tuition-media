import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState, useEffect, useRef } from 'react';
import AsyncSelect from 'react-select/async';
import { CircleDollarSign, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type Application = {
    id: number;
    status: 'pending' | 'shortlisted' | 'interested' | 'not_interested' | 'rejected' | 'hired';
    admin_note: string | null;
    hired_at: string | null;
    commission_type: 'fixed' | 'percentage' | null;
    commission_value: string | number | null;
    commission_amount: number | null;
    commission_received_amount: number | null;
    commission_payment_status: 'unpaid' | 'partial' | 'paid' | null;
    expected_salary: number | null;
    cover_note: string | null;
    created_at: string;
    tutor: { id: number; name: string; email: string; phone?: string | null; university?: string | null } | null;
    post: {
        id: number;
        tuition_code: string | null;
        title: string | null;
        salary_type: 'fixed' | 'range' | 'negotiable';
        salary_min: number | null;
        salary_max: number | null;
    } | null;
    guardian: { id: number; name: string; email: string; phone?: string | null } | null;
};

type Props = {
    applications: {
        data: Application[];
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters: { status: string; tutor_id: string; tutor_label: string; university: string; tuition_code: string };
    statuses: Application['status'][];
    universities: string[];
};

const SELECT_STYLES = {
    control: (base: object) => ({ ...base, backgroundColor: 'var(--background)', borderColor: 'var(--border)', minHeight: '40px' }),
    menu: (base: object) => ({ ...base, backgroundColor: 'var(--background)', zIndex: 50 }),
    option: (base: object, state: { isFocused: boolean }) => ({
        ...base,
        backgroundColor: state.isFocused ? 'var(--accent)' : 'var(--background)',
        color: 'var(--foreground)',
    }),
    singleValue: (base: object) => ({ ...base, color: 'var(--foreground)' }),
    input: (base: object) => ({ ...base, color: 'var(--foreground)' }),
};

export default function AdminApplicationsIndex({ applications, filters, statuses, universities }: Props) {
    const formatDate = (value: string) => new Date(value).toISOString().slice(0, 10);
    const [isHireModalOpen, setIsHireModalOpen] = useState(false);
    const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
    const [commissionType, setCommissionType] = useState<'fixed' | 'percentage'>('fixed');
    const [commissionValue, setCommissionValue] = useState('');
    const [commissionBaseAmount, setCommissionBaseAmount] = useState('');
    const [commissionReceivedAmount, setCommissionReceivedAmount] = useState('');
    const [status, setStatus] = useState(filters.status);
    const [tutorId, setTutorId] = useState(filters.tutor_id ?? '');
    const [tutorOption, setTutorOption] = useState<{ value: string; label: string } | null>(
        filters.tutor_id ? { value: filters.tutor_id, label: filters.tutor_label ?? filters.tutor_id } : null
    );
    const [university, setUniversity] = useState(filters.university ?? '');
    const [tuition_code, setTuitionCode] = useState(filters.tuition_code ?? '');
    const [loading, setLoading] = useState(false);
    const hasMountedRef = useRef(false);

    useEffect(() => {
        const startHandler = router.on('start', () => setLoading(true));
        const finishHandler = router.on('finish', () => setLoading(false));
        return () => {
            startHandler();
            finishHandler();
        };
    }, []);

    const hasFilters = !!(status || tutorId || university || tuition_code);

    const clearFilters = () => { setStatus(''); setTutorId(''); setTutorOption(null); setUniversity(''); setTuitionCode(''); };

    useEffect(() => {
        if (!hasMountedRef.current) {
            hasMountedRef.current = true;
            return;
        }

        const timeout = setTimeout(() => {
            router.get(
                '/admin/applications',
                {
                    status: status || undefined,
                    tutor_id: tutorId || undefined,
                    university: university || undefined,
                    tuition_code: tuition_code || undefined,
                },
                { preserveState: true, replace: true }
            );
        }, 300);

        return () => clearTimeout(timeout);
    }, [status, tutorId, university, tuition_code]);

    const loadTutorOptions = (inputValue: string) =>
        fetch(`/admin/tutors/search?q=${encodeURIComponent(inputValue)}`)
            .then((res) => res.json());

    const updateApplicationStatus = (
        applicationId: number,
        nextStatus: 'shortlisted' | 'rejected' | 'interested' | 'not_interested',
    ) => {
        router.patch(
            `/admin/applications/${applicationId}/contact-status`,
            { status: nextStatus },
            { preserveScroll: true },
        );
    };

    const getNextStatusOptions = (currentStatus: Application['status']): Application['status'][] => {
        if (currentStatus === 'pending') {
            return ['pending', 'shortlisted', 'rejected'];
        }
        if (currentStatus === 'shortlisted') {
            return ['shortlisted', 'interested', 'not_interested'];
        }
        if (currentStatus === 'interested') {
            return ['interested', 'hired'];
        }

        return [currentStatus];
    };

    const openHireModal = (application: Application) => {
        const fallbackBaseAmount =
            application.expected_salary
            ?? (application.post?.salary_type === 'fixed' ? application.post.salary_min : null);

        setSelectedApplication(application);
        setCommissionType('fixed');
        setCommissionValue('');
        setCommissionBaseAmount(fallbackBaseAmount ? String(fallbackBaseAmount) : '');
        setCommissionReceivedAmount('');
        setIsHireModalOpen(true);
    };

    const tuitionAmountLabel = useMemo(() => {
        if (!selectedApplication?.post) {
            return '-';
        }

        const { salary_type: salaryType, salary_min: salaryMin, salary_max: salaryMax } = selectedApplication.post;

        if (salaryType === 'fixed' && salaryMin) {
            return `BDT ${salaryMin}`;
        }

        if (salaryType === 'range' && salaryMin && salaryMax) {
            return `BDT ${salaryMin} - ${salaryMax}`;
        }

        if (salaryType === 'negotiable') {
            return 'Negotiable';
        }

        return '-';
    }, [selectedApplication]);

    const derivedCommissionAmount = useMemo(() => {
        const value = Number(commissionValue);

        if (Number.isNaN(value) || value <= 0) {
            return null;
        }

        if (commissionType === 'fixed') {
            return Math.round(value);
        }

        const base = Number(commissionBaseAmount);

        if (Number.isNaN(base) || base <= 0) {
            return null;
        }

        return Math.round((base * value) / 100);
    }, [commissionBaseAmount, commissionType, commissionValue]);

    const statusSelectToneClass = (status: Application['status']) => {
        if (status === 'hired') {
            return 'border-green-200 text-green-700';
}

        if (status === 'shortlisted') {
            return 'border-blue-200 text-blue-700';
}

        if (status === 'interested') {
            return 'border-emerald-200 text-emerald-700';
}

        if (status === 'not_interested') {
            return 'border-rose-200 text-rose-700';
}

        if (status === 'rejected') {
            return 'border-red-200 text-red-700';
}

        return 'border-amber-200 text-amber-700';
    };

    const confirmHire = () => {
        if (!selectedApplication) {
            return;
        }

        const value = Number(commissionValue);

        if (Number.isNaN(value) || value <= 0) {
            alert('Enter a valid commission value.');

            return;
        }

        const payload: { commission_type: 'fixed' | 'percentage'; commission_value: number; commission_base_amount?: number; commission_received_amount: number } = {
            commission_type: commissionType,
            commission_value: value,
            commission_received_amount: 0,
        };
        const received = Number(commissionReceivedAmount);

        if (Number.isNaN(received) || received <= 0) {
            alert('Enter a valid received commission amount.');

            return;
        }

        if (commissionType === 'percentage') {
            const base = Number(commissionBaseAmount);

            if (Number.isNaN(base) || base <= 0) {
                alert('Enter a valid tuition/base amount for percentage commission.');

                return;
            }

            payload.commission_base_amount = Math.round(base);
        }

        const estimatedAmount = derivedCommissionAmount;

        if (estimatedAmount !== null && received > estimatedAmount) {
            alert('Received amount cannot exceed estimated commission.');

            return;
        }
        payload.commission_received_amount = Math.round(received);

        router.patch(`/admin/applications/${selectedApplication.id}/hire`, payload, {
            preserveScroll: true,
            onSuccess: () => setIsHireModalOpen(false),
        });
    };

    return (
        <>
            <Head title="Admin Applications" />

            <div className="space-y-6 p-4">
                <div>
                    <h1 className="text-2xl font-semibold">Applications</h1>
                </div>

                <div className="flex items-end gap-4">
                <div className="grid flex-1 gap-4 md:grid-cols-4">
                    <div>
                        <label htmlFor="status" className="mb-2 block text-sm font-medium">
                            Filter by status
                        </label>
                        <select
                            id="status"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={status}
                            onChange={(event) => setStatus(event.target.value)}
                        >
                            <option value="">All statuses</option>
                            {statuses.map((status) => (
                                <option key={status} value={status}>
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="tutor_id" className="mb-2 block text-sm font-medium">
                            Filter by tutor
                        </label>
                        <AsyncSelect
                            instanceId="admin-applications-tutor-filter"
                            inputId="tutor_id"
                            value={tutorOption}
                            onChange={(selected) => {
                                setTutorOption(selected);
                                setTutorId(selected?.value ?? '');
                            }}
                            loadOptions={loadTutorOptions}
                            placeholder="Search tutor..."
                            isClearable
                            styles={SELECT_STYLES}
                        />
                    </div>

                    <div>
                        <label htmlFor="tuition_code" className="mb-2 block text-sm font-medium">
                            Filter by tuition id
                        </label>
                        <Input
                            id="tuition_code"
                            placeholder="e.g. TID7K9M2Q"
                            value={tuition_code}
                            onChange={(event) => setTuitionCode(event.target.value)}
                        />
                    </div>

                    <div>
                        <label htmlFor="university" className="mb-2 block text-sm font-medium">
                            Filter by university
                        </label>
                        <select
                            id="university"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={university}
                            onChange={(event) => setUniversity(event.target.value)}
                        >
                            <option value="">All universities</option>
                            {universities.map((item) => (
                                <option key={item} value={item}>
                                    {item}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                    {hasFilters && (
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
                                <th className="px-4 py-3 text-left">Tuition ID</th>
                                <th className="px-4 py-3 text-left">Tutor</th>
                                <th className="px-4 py-3 text-left">Tutor Phone</th>
                                <th className="px-4 py-3 text-left">University</th>
                                <th className="px-4 py-3 text-left">Guardian</th>
                                <th className="px-4 py-3 text-left">Guardian Phone</th>
                                <th className="px-4 py-3 text-left">Expected Salary</th>
                                <th className="px-4 py-3 text-left">Applied</th>
                                <th className="px-4 py-3 text-left">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <tr key={i} className="border-t">
                                        <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                                        <td className="px-4 py-3">
                                            <div className="space-y-1.5">
                                                <Skeleton className="h-4 w-32" />
                                                <Skeleton className="h-3 w-40" />
                                            </div>
                                        </td>
                                        <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                                        <td className="px-4 py-3">
                                            <div className="space-y-1.5">
                                                <Skeleton className="h-4 w-32" />
                                                <Skeleton className="h-3 w-40" />
                                            </div>
                                        </td>
                                        <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-8 w-36 rounded-md" /></td>
                                    </tr>
                                ))
                            ) : (
                            <>
                            {applications.data.length === 0 && (
                                <tr>
                                    <td className="px-4 py-6 text-muted-foreground" colSpan={9}>
                                        No applications found.
                                    </td>
                                </tr>
                            )}
                            {applications.data.map((application) => {
                                return (
                                <tr key={application.id} className="border-t">
                                    <td className="px-4 py-3 font-mono text-xs">{application.post?.tuition_code ?? '-'}</td>
                                    <td className="px-4 py-3">
                                        {application.tutor ? (
                                            <div>
                                                <p>{application.tutor.name}</p>
                                                <p className="text-xs text-muted-foreground">{application.tutor.email}</p>
                                            </div>
                                        ) : (
                                            '-'
                                        )}
                                    </td>
                                    <td className="px-4 py-3">{application.tutor?.phone ?? '-'}</td>
                                    <td className="px-4 py-3">{application.tutor?.university ?? '-'}</td>
                                    <td className="px-4 py-3">
                                        {application.guardian ? (
                                            <div>
                                                <p>{application.guardian.name}</p>
                                                <p className="text-xs text-muted-foreground">{application.guardian.email}</p>
                                            </div>
                                        ) : (
                                            '-'
                                        )}
                                    </td>
                                    <td className="px-4 py-3">{application.guardian?.phone ?? '-'}</td>
                                    <td className="px-4 py-3">
                                        {application.expected_salary ? `BDT ${application.expected_salary}` : '-'}
                                    </td>
                                    <td className="px-4 py-3">{formatDate(application.created_at)}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <select
                                                className={`h-9 w-auto rounded-md border bg-white px-3 text-sm font-medium capitalize shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 ${statusSelectToneClass(application.status)}`}
                                                value={application.status}
                                                onChange={(event) => {
                                                    const nextStatus = event.target.value as Application['status'];

                                                    if (nextStatus === application.status) {
                                                        return;
                                                    }

                                                    if (nextStatus === 'hired' && application.status === 'interested') {
                                                        openHireModal(application);

                                                        return;
                                                    }

                                                    if (
                                                        nextStatus === 'shortlisted' ||
                                                        nextStatus === 'rejected' ||
                                                        nextStatus === 'interested' ||
                                                        nextStatus === 'not_interested'
                                                    ) {
                                                        updateApplicationStatus(application.id, nextStatus);
                                                    }
                                                }}
                                            >
                                                {getNextStatusOptions(application.status).map((option) => (
                                                    <option key={option} value={option}>
                                                        {option.replace('_', ' ')}
                                                    </option>
                                                ))}
                                            </select>
                                            {application.status === 'hired' && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Link
                                                            href={`/admin/commissions?search=${encodeURIComponent(application.post?.tuition_code ?? String(application.id))}`}
                                                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-green-200 text-green-700 transition-colors hover:bg-green-50"
                                                            aria-label="Manage commission"
                                                        >
                                                            <CircleDollarSign className="h-4 w-4" />
                                                        </Link>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Manage commission</TooltipContent>
                                                </Tooltip>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                                );
                            })}
                            </>
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

            <Dialog open={isHireModalOpen} onOpenChange={setIsHireModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hire Tutor & Set Commission</DialogTitle>
                        <DialogDescription>
                            Set commission details before confirming hire.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="rounded-md border p-3 text-sm">
                            <p><span className="font-medium">Tuition fee:</span> {tuitionAmountLabel}</p>
                            <p><span className="font-medium">Tutor expected fee:</span> {selectedApplication?.expected_salary ? `BDT ${selectedApplication.expected_salary}` : '-'}</p>
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm font-medium">Commission Type</p>
                            <div className="flex gap-2">
                                <Button type="button" variant={commissionType === 'fixed' ? 'default' : 'outline'} onClick={() => setCommissionType('fixed')}>
                                    Fixed
                                </Button>
                                <Button type="button" variant={commissionType === 'percentage' ? 'default' : 'outline'} onClick={() => setCommissionType('percentage')}>
                                    Percentage
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                {commissionType === 'fixed' ? 'Commission Amount (BDT)' : 'Commission Percentage'}
                            </label>
                            <Input
                                type="number"
                                min={0}
                                step="0.01"
                                value={commissionValue}
                                onChange={(event) => setCommissionValue(event.target.value)}
                            />
                        </div>

                        {commissionType === 'percentage' && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Tuition/Base Amount For Percentage</label>
                                <Input
                                    type="number"
                                    min={1}
                                    value={commissionBaseAmount}
                                    onChange={(event) => setCommissionBaseAmount(event.target.value)}
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Received Commission Amount (BDT)</label>
                            <Input
                                type="number"
                                min={1}
                                step="1"
                                value={commissionReceivedAmount}
                                onChange={(event) => setCommissionReceivedAmount(event.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Enter partial or full received amount now. Hire will set payment status to partial or paid.
                            </p>
                        </div>

                        <div className="rounded-md border bg-muted/30 p-3">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Estimated Admin Commission
                            </p>
                            <p className="mt-1 text-lg font-semibold">
                                {derivedCommissionAmount !== null ? `BDT ${derivedCommissionAmount}` : '-'}
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsHireModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="button" onClick={confirmHire}>
                            Confirm Hire
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

AdminApplicationsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Applications',
            href: '/admin/applications',
        },
    ],
};
