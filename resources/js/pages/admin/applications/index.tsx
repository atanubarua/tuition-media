import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState, useEffect } from 'react';
import Select from 'react-select';
import { Badge } from '@/components/ui/badge';
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

type Application = {
    id: number;
    status: 'pending' | 'shortlisted' | 'rejected' | 'hired';
    admin_contact_status: 'new' | 'contacted' | 'interested' | 'not_interested' | null;
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
    tutor: { id: number; name: string; email: string } | null;
    post: {
        id: number;
        tuition_code: string | null;
        title: string | null;
        salary_type: 'fixed' | 'range' | 'negotiable';
        salary_min: number | null;
        salary_max: number | null;
    } | null;
    guardian: { id: number; name: string; email: string } | null;
};

type Props = {
    applications: Application[];
    filters: { status: string; tutor_id: string; tuition_code: string };
    statuses: Application['status'][];
    contactStatuses: Application['admin_contact_status'][];
    tutors: { id: number; name: string; email: string }[];
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

export default function AdminApplicationsIndex({ applications, filters, statuses, tutors }: Props) {
    const formatDate = (value: string) => new Date(value).toISOString().slice(0, 10);
    const [isHireModalOpen, setIsHireModalOpen] = useState(false);
    const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
    const [commissionType, setCommissionType] = useState<'fixed' | 'percentage'>('fixed');
    const [commissionValue, setCommissionValue] = useState('');
    const [commissionBaseAmount, setCommissionBaseAmount] = useState('');
    const [status, setStatus] = useState(filters.status);
    const [tutorId, setTutorId] = useState(filters.tutor_id ?? '');
    const [tuition_code, setTuitionCode] = useState(filters.tuition_code ?? '');

    useEffect(() => {
        const timeout = setTimeout(() => {
            router.get(
                '/admin/applications',
                {
                    status: status || undefined,
                    tutor_id: tutorId || undefined,
                    tuition_code: tuition_code || undefined,
                },
                { preserveState: true, replace: true }
            );
        }, 300);

        return () => clearTimeout(timeout);
    }, [status, tutorId, tuition_code]);

    const updateContactStatus = (applicationId: number, nextStatus: Application['admin_contact_status']) => {
        router.patch(
            `/admin/applications/${applicationId}/contact-status`,
            { admin_contact_status: nextStatus },
            { preserveScroll: true },
        );
    };

    const openHireModal = (application: Application) => {
        setSelectedApplication(application);
        setCommissionType('fixed');
        setCommissionValue('');
        setCommissionBaseAmount(application.expected_salary ? String(application.expected_salary) : '');
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

    const statusBadgeClass = (status: Application['status']) => {
        if (status === 'hired') {
return 'bg-green-100 text-green-800 border-green-200';
}

        if (status === 'shortlisted') {
return 'bg-blue-100 text-blue-800 border-blue-200';
}

        if (status === 'rejected') {
return 'bg-red-100 text-red-800 border-red-200';
}

        return 'bg-amber-100 text-amber-800 border-amber-200';
    };

    const commissionStatusBadgeClass = (commissionStatus: Application['commission_payment_status']) => {
        if (commissionStatus === 'paid') {
            return 'bg-green-100 text-green-800 border-green-200';
        }

        if (commissionStatus === 'partial') {
            return 'bg-blue-100 text-blue-800 border-blue-200';
        }

        if (commissionStatus === 'unpaid') {
            return 'bg-amber-100 text-amber-800 border-amber-200';
        }

        return 'bg-muted text-muted-foreground border-border';
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

        const payload: { commission_type: 'fixed' | 'percentage'; commission_value: number; commission_base_amount?: number } = {
            commission_type: commissionType,
            commission_value: value,
        };

        if (commissionType === 'percentage') {
            const base = Number(commissionBaseAmount);

            if (Number.isNaN(base) || base <= 0) {
                alert('Enter a valid tuition/base amount for percentage commission.');

                return;
            }

            payload.commission_base_amount = Math.round(base);
        }

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
                    <p className="text-sm text-muted-foreground">All tutor applications across the platform.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
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
                        <Select
                            inputId="tutor_id"
                            value={
                                tutorId
                                    ? (() => {
                                          const selected = tutors.find((tutor) => String(tutor.id) === tutorId);

                                          return selected
                                              ? { value: String(selected.id), label: `${selected.name} (${selected.email})` }
                                              : null;
                                      })()
                                    : null
                            }
                            onChange={(selected) => setTutorId(selected?.value ?? '')}
                            options={tutors.map((tutor) => ({
                                value: String(tutor.id),
                                label: `${tutor.name} (${tutor.email})`,
                            }))}
                            placeholder="All tutors"
                            isClearable
                            isSearchable
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
                </div>

                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/40">
                            <tr>
                                <th className="px-4 py-3 text-left">Post</th>
                                <th className="px-4 py-3 text-left">Tuition ID</th>
                                <th className="px-4 py-3 text-left">Tutor</th>
                                <th className="px-4 py-3 text-left">Guardian</th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3 text-left">Contact</th>
                                <th className="px-4 py-3 text-left">Expected Salary</th>
                                <th className="px-4 py-3 text-left">Commission</th>
                                <th className="px-4 py-3 text-left">Commission Status</th>
                                <th className="px-4 py-3 text-left">Applied</th>
                                <th className="px-4 py-3 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {applications.length === 0 && (
                                <tr>
                                    <td className="px-4 py-6 text-muted-foreground" colSpan={11}>
                                        No applications found.
                                    </td>
                                </tr>
                            )}
                            {applications.map((application) => {
                                const contactStatus = application.admin_contact_status ?? 'new';

                                return (
                                <tr key={application.id} className="border-t">
                                    <td className="px-4 py-3">
                                        {application.post ? (
                                            <Link href={`/tuition-posts/${application.post.id}`} className="font-medium hover:underline">
                                                {application.post.title ?? `Tuition Post #${application.post.id}`}
                                            </Link>
                                        ) : (
                                            '-'
                                        )}
                                    </td>
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
                                    <td className="px-4 py-3">
                                        <Badge variant="outline" className={statusBadgeClass(application.status)}>
                                            {application.status}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 capitalize">{contactStatus.replace('_', ' ')}</td>
                                    <td className="px-4 py-3">
                                        {application.expected_salary ? `BDT ${application.expected_salary}` : '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        {application.commission_amount
                                            ? `BDT ${application.commission_amount}`
                                            : '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant="outline" className={commissionStatusBadgeClass(application.commission_payment_status)}>
                                            {application.commission_payment_status ?? '-'}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3">{formatDate(application.created_at)}</td>
                                    <td className="px-4 py-3">
                                        {application.status === 'hired' ? (
                                            <span className="text-xs text-green-700">Hired</span>
                                        ) : (
                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => updateContactStatus(application.id, 'contacted')}
                                                >
                                                    Contacted
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => updateContactStatus(application.id, 'interested')}
                                                >
                                                    Interested
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => updateContactStatus(application.id, 'not_interested')}
                                                >
                                                    Not Interested
                                                </Button>
                                                {application.status === 'shortlisted' && contactStatus === 'interested' && (
                                                    <Button type="button" size="sm" onClick={() => openHireModal(application)}>
                                                        Hire
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
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
