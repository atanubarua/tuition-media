import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
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
    status: string;
    hired_at: string | null;
    commission_type: 'fixed' | 'percentage' | null;
    commission_value: string | number | null;
    commission_amount: number | null;
    commission_received_amount: number | null;
    commission_payment_status: 'unpaid' | 'partial' | 'paid' | null;
    commission_due_amount: number;
    tuition_amount: number | null;
    post: { id: number; tuition_code: string | null; title: string | null } | null;
    tutor: { id: number; name: string; email: string } | null;
    guardian: { id: number; name: string; email: string } | null;
    payment_history: Array<{
        id: number;
        amount: number;
        note: string | null;
        received_at: string;
    }>;
};

export default function AdminCommissionsIndex({ applications }: { applications: Application[] }) {
    const formatDate = (value: string | null) => (value ? new Date(value).toISOString().slice(0, 10) : '-');
    const formatCurrency = (value: number | null | undefined) => `BDT ${value ?? 0}`;
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
    const [receivedAmountInput, setReceivedAmountInput] = useState('');
    const [paymentNoteInput, setPaymentNoteInput] = useState('');

    const openPaymentModal = (application: Application) => {
        setSelectedApplication(application);
        setReceivedAmountInput('');
        setPaymentNoteInput('');
        setIsPaymentModalOpen(true);
    };

    const duePreview = useMemo(() => {
        if (!selectedApplication) {
            return null;
        }

        const total = selectedApplication.commission_amount ?? 0;
        const currentReceived = selectedApplication.commission_received_amount ?? 0;
        const incoming = Number(receivedAmountInput || 0);

        if (Number.isNaN(incoming) || incoming < 0) {
            return null;
        }

        return Math.max(0, total - Math.round(currentReceived + incoming));
    }, [receivedAmountInput, selectedApplication]);

    const incomingAmount = Number(receivedAmountInput || 0);
    const isIncomingAmountValid = useMemo(() => {
        if (!selectedApplication) {
            return false;
        }

        if (selectedApplication.commission_due_amount <= 0) {
            return false;
        }

        if (Number.isNaN(incomingAmount) || incomingAmount <= 0) {
            return false;
        }

        return incomingAmount <= selectedApplication.commission_due_amount;
    }, [incomingAmount, selectedApplication]);

    const paymentStatusBadgeClass = (status: Application['commission_payment_status']) => {
        if (status === 'paid') {
return 'bg-green-100 text-green-800 border-green-200';
}

        if (status === 'partial') {
return 'bg-blue-100 text-blue-800 border-blue-200';
}

        return 'bg-amber-100 text-amber-800 border-amber-200';
    };

    const confirmPaymentUpdate = () => {
        if (!selectedApplication) {
            return;
        }

        if (selectedApplication.commission_due_amount <= 0) {
            alert('Commission is already fully paid.');

            return;
        }

        const received = Number(receivedAmountInput);

        if (Number.isNaN(received) || received <= 0) {
            alert('Please enter a valid amount.');

            return;
        }

        if (received > selectedApplication.commission_due_amount) {
            alert(`Received amount cannot exceed due amount (BDT ${selectedApplication.commission_due_amount}).`);

            return;
        }

        router.patch(
            `/admin/commissions/${selectedApplication.id}/payment`,
            { received_amount: Math.round(received), note: paymentNoteInput || undefined },
            {
                preserveScroll: true,
                onSuccess: () => setIsPaymentModalOpen(false),
            },
        );
    };

    return (
        <>
            <Head title="Commissions" />
            <div className="space-y-6 p-4">
                <div>
                    <h1 className="text-2xl font-semibold">Commissions</h1>
                    <p className="text-sm text-muted-foreground">Track commission collection from hired placements.</p>
                </div>

                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/40">
                            <tr>
                                <th className="px-4 py-3 text-left">Post</th>
                                <th className="px-4 py-3 text-left">Tuition ID</th>
                                <th className="px-4 py-3 text-left">Tutor</th>
                                <th className="px-4 py-3 text-left">Guardian</th>
                                <th className="px-4 py-3 text-left">Tuition Amount</th>
                                <th className="px-4 py-3 text-left">Commission</th>
                                <th className="px-4 py-3 text-left">Received</th>
                                <th className="px-4 py-3 text-left">Due</th>
                                <th className="px-4 py-3 text-left">Payment Status</th>
                                <th className="px-4 py-3 text-left">Hired At</th>
                                <th className="px-4 py-3 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {applications.length === 0 && (
                                <tr>
                                    <td className="px-4 py-6 text-muted-foreground" colSpan={11}>
                                        No hired placements yet.
                                    </td>
                                </tr>
                            )}
                            {applications.map((application) => (
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
                                    <td className="px-4 py-3">{application.tutor?.name ?? '-'}</td>
                                    <td className="px-4 py-3">{application.guardian?.name ?? '-'}</td>
                                    <td className="px-4 py-3">
                                        {application.tuition_amount ? formatCurrency(application.tuition_amount) : '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        {formatCurrency(application.commission_amount)}
                                        {application.commission_type === 'percentage' ? ` (${application.commission_value}%)` : ''}
                                    </td>
                                    <td className="px-4 py-3">{formatCurrency(application.commission_received_amount)}</td>
                                    <td className="px-4 py-3">{formatCurrency(application.commission_due_amount)}</td>
                                    <td className="px-4 py-3">
                                        <Badge
                                            variant="outline"
                                            className={paymentStatusBadgeClass(application.commission_payment_status)}
                                        >
                                            {application.commission_payment_status ?? 'unpaid'}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3">{formatDate(application.hired_at)}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-2">
                                            <Button size="sm" variant={application.commission_due_amount > 0 ? 'outline' : 'ghost'} onClick={() => openPaymentModal(application)}>
                                                Manage
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
                <DialogContent className="flex max-h-[85vh] flex-col">
                    <DialogHeader>
                        <DialogTitle>Manage Commission</DialogTitle>
                        <DialogDescription>
                            Review summary, add a payment, and track installment history.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
                        <div className="grid gap-2 text-sm sm:grid-cols-3">
                            <div className="rounded-md border p-3">
                                <p className="text-xs text-muted-foreground">Total Commission</p>
                                <p className="mt-1 font-semibold">{formatCurrency(selectedApplication?.commission_amount)}</p>
                            </div>
                            <div className="rounded-md border p-3">
                                <p className="text-xs text-muted-foreground">Received</p>
                                <p className="mt-1 font-semibold">{formatCurrency(selectedApplication?.commission_received_amount)}</p>
                            </div>
                            <div className="rounded-md border p-3">
                                <p className="text-xs text-muted-foreground">Due</p>
                                <p className="mt-1 font-semibold">{formatCurrency(selectedApplication?.commission_due_amount)}</p>
                            </div>
                        </div>

                        {(selectedApplication?.commission_due_amount ?? 0) > 0 ? (
                            <div className="space-y-3 rounded-md border p-3">
                                <p className="font-medium text-sm">Add New Installment</p>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Amount</label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={selectedApplication?.commission_due_amount ?? undefined}
                                        value={receivedAmountInput}
                                        onChange={(event) => setReceivedAmountInput(event.target.value)}
                                        placeholder={`Max ${formatCurrency(selectedApplication?.commission_due_amount)}`}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        You can add up to {formatCurrency(selectedApplication?.commission_due_amount)} in this installment.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Note (optional)</label>
                                    <Input
                                        value={paymentNoteInput}
                                        onChange={(event) => setPaymentNoteInput(event.target.value)}
                                        placeholder="e.g. first installment via bKash"
                                    />
                                </div>

                                <div className="rounded-md border bg-muted/30 p-3 text-sm">
                                    <p className="font-medium">
                                        Due after this installment: {duePreview !== null ? formatCurrency(duePreview) : '-'}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-md border bg-muted/30 p-3 text-sm">
                                <p className="font-medium">This commission is fully paid.</p>
                                <p className="text-muted-foreground">Installment updates are locked. You can review history below.</p>
                            </div>
                        )}

                        <div className="space-y-2 rounded-md border p-3 text-sm">
                            <p className="font-medium">Payment History</p>
                            {selectedApplication?.payment_history.length ? (
                                <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                                    {selectedApplication.payment_history.map((payment) => (
                                        <div key={payment.id} className="rounded border px-2 py-1.5">
                                            <p className="text-sm font-medium">+{formatCurrency(payment.amount)}</p>
                                            <p className="text-xs text-muted-foreground">{formatDate(payment.received_at)}</p>
                                            {payment.note && <p className="text-xs text-muted-foreground">{payment.note}</p>}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground">No payments recorded yet.</p>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="mt-2 border-t pt-3">
                        <Button type="button" variant="outline" onClick={() => setIsPaymentModalOpen(false)}>
                            Close
                        </Button>
                        {(selectedApplication?.commission_due_amount ?? 0) > 0 && (
                            <Button type="button" onClick={confirmPaymentUpdate} disabled={!isIncomingAmountValid}>
                                Save Payment
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

AdminCommissionsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Commissions',
            href: '/admin/commissions',
        },
    ],
};
