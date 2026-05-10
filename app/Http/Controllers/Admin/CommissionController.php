<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CommissionPayment;
use App\Models\TuitionApplication;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CommissionController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'payment_status' => ['nullable', 'in:unpaid,partial,paid'],
        ]);

        $search = trim((string) ($filters['search'] ?? ''));
        $paymentStatus = $filters['payment_status'] ?? '';

        $applications = TuitionApplication::query()
            ->where('status', 'hired')
            ->when($paymentStatus !== '', function ($query) use ($paymentStatus) {
                $query->where('commission_payment_status', $paymentStatus);
            })
            ->when($search !== '', function ($query) use ($search) {
                $query
                    ->where(function ($innerQuery) use ($search) {
                        $innerQuery
                            ->where('id', is_numeric($search) ? (int) $search : -1)
                            ->orWhereHas('tutor', function ($tutorQuery) use ($search) {
                                $tutorQuery
                                    ->where('name', 'like', "%{$search}%")
                                    ->orWhere('email', 'like', "%{$search}%");
                            })
                            ->orWhereHas('tuitionPost', function ($postQuery) use ($search) {
                                $postQuery
                                    ->where('tuition_code', 'like', "%{$search}%")
                                    ->orWhere('title', 'like', "%{$search}%");
                            })
                            ->orWhereHas('tuitionPost.guardian', function ($guardianQuery) use ($search) {
                                $guardianQuery
                                    ->where('name', 'like', "%{$search}%")
                                    ->orWhere('email', 'like', "%{$search}%");
                            });
                    });
            })
            ->with([
                'tutor:id,name,email,phone',
                'tuitionPost:id,tuition_code,title,guardian_id,salary_type,salary_min,salary_max',
                'tuitionPost.guardian:id,name,email,phone',
                'commissionPayments',
            ])
            ->latest('hired_at')
            ->get()
            ->map(function (TuitionApplication $application) {
                $due = max(0, (int) ($application->commission_amount ?? 0) - (int) ($application->commission_received_amount ?? 0));
                $tuitionAmount = null;

                if (! empty($application->expected_salary) && (int) $application->expected_salary > 0) {
                    $tuitionAmount = (int) $application->expected_salary;
                } elseif ($application->tuitionPost?->salary_type === 'fixed' && ! empty($application->tuitionPost->salary_min)) {
                    $tuitionAmount = (int) $application->tuitionPost->salary_min;
                }

                return [
                    'id' => $application->id,
                    'status' => $application->status,
                    'hired_at' => $application->hired_at,
                    'commission_type' => $application->commission_type,
                    'commission_value' => $application->commission_value,
                    'commission_amount' => $application->commission_amount,
                    'commission_received_amount' => $application->commission_received_amount,
                    'commission_payment_status' => $application->commission_payment_status,
                    'commission_due_amount' => $due,
                    'commission_due_date' => $application->commission_due_date?->toDateString(),
                    'tuition_amount' => $tuitionAmount,
                    'payment_history' => $application->commissionPayments
                        ->sortByDesc('received_at')
                        ->values()
                        ->map(fn (CommissionPayment $payment) => [
                            'id' => $payment->id,
                            'amount' => $payment->amount,
                            'note' => $payment->note,
                            'received_at' => $payment->received_at,
                            'due_on' => $payment->due_on?->toDateString(),
                        ]),
                    'post' => $application->tuitionPost ? [
                        'id' => $application->tuitionPost->id,
                        'tuition_code' => $application->tuitionPost->tuition_code,
                        'title' => $application->tuitionPost->title,
                    ] : null,
                    'tutor' => $application->tutor ? [
                        'id' => $application->tutor->id,
                        'name' => $application->tutor->name,
                        'email' => $application->tutor->email,
                        'phone' => $application->tutor->phone,
                    ] : null,
                    'guardian' => $application->tuitionPost?->guardian ? [
                        'id' => $application->tuitionPost->guardian->id,
                        'name' => $application->tuitionPost->guardian->name,
                        'email' => $application->tuitionPost->guardian->email,
                        'phone' => $application->tuitionPost->guardian->phone,
                    ] : null,
                ];
            });

        return Inertia::render('admin/commissions/index', [
            'applications' => $applications,
            'filters' => [
                'search' => $search,
                'payment_status' => $paymentStatus,
            ],
        ]);
    }

    public function updatePayment(Request $request, TuitionApplication $application): RedirectResponse
    {
        $validated = $request->validate([
            'received_amount' => ['required', 'integer', 'min:1'],
            'note' => ['nullable', 'string', 'max:500'],
            'due_date' => ['nullable', 'date', 'after_or_equal:today'],
        ]);

        if ($application->status !== 'hired') {
            return back()->withErrors([
                'received_amount' => 'Payment can only be updated for hired applications.',
            ]);
        }

        DB::transaction(function () use ($request, $application, $validated): void {
            $total = (int) ($application->commission_amount ?? 0);
            $currentReceived = max(0, (int) ($application->commission_received_amount ?? 0));
            $due = max(0, $total - $currentReceived);
            $incoming = (int) $validated['received_amount'];

            if ($total <= 0 || $due <= 0) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'received_amount' => 'Commission is already fully paid for this application.',
                ]);
            }

            if ($incoming > $due) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'received_amount' => "Received amount cannot exceed due amount (BDT {$due}).",
                ]);
            }

            $updatedReceived = $currentReceived + $incoming;
            $remainingDue = max(0, $total - $updatedReceived);
            $dueDate = $remainingDue > 0 ? ($validated['due_date'] ?? null) : null;

            CommissionPayment::create([
                'tuition_application_id' => $application->id,
                'amount' => $incoming,
                'received_by' => $request->user()->id,
                'note' => $validated['note'] ?? null,
                'received_at' => now(),
                'due_on' => $dueDate,
            ]);

            $status = 'unpaid';
            if ($updatedReceived > 0 && $updatedReceived < $total) {
                $status = 'partial';
            }
            if ($total > 0 && $updatedReceived >= $total) {
                $status = 'paid';
            }

            $application->update([
                'commission_received_amount' => $updatedReceived,
                'commission_payment_status' => $status,
                'commission_paid_at' => $status === 'paid' ? now() : null,
                'commission_due_date' => $dueDate,
            ]);
            $application->tuitionPost?->update([
                'status' => $status === 'paid' ? 'completed' : 'assigned',
            ]);
        });

        return back()->with('toast', [
            'type' => 'success',
            'message' => 'Commission payment updated.',
        ]);
    }
}
