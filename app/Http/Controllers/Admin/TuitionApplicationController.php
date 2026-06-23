<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CommissionPayment;
use App\Models\Notification;
use App\Models\TuitionApplication;
use App\Models\TuitionPost;
use App\Models\User;
use App\Support\TutorMatchScorer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class TuitionApplicationController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->string('status')->toString();
        $tutorId = $request->integer('tutor_id');
        $university = trim($request->string('university')->toString());
        $tuitionCode = strtoupper(str_replace('-', '', trim($request->string('tuition_code')->toString())));

        $applications = TuitionApplication::query()
            ->with([
                'tutor:id,name,email,phone',
                'tutor.tutorProfile.university:id,name',
                'tuitionPost:id,tuition_code,title,guardian_id,salary_type,salary_min,salary_max',
                'tuitionPost.guardian:id,name,email,phone',
            ])
            ->when($status !== '', fn ($query) => $query->where('status', $status))
            ->when($tutorId > 0, fn ($query) => $query->where('tutor_id', $tutorId))
            ->when($university !== '', function ($query) use ($university): void {
                $query->whereHas('tutor.tutorProfile.university', fn ($universityQuery) => $universityQuery->where('name', $university));
            })
            ->when($tuitionCode !== '', function ($query) use ($tuitionCode) {
                $query->whereHas('tuitionPost', function ($postQuery) use ($tuitionCode): void {
                    $postQuery->whereRaw('REPLACE(UPPER(tuition_code), "-", "") = ?', [$tuitionCode]);
                });
            })
            ->latest()
            ->paginate(50)
            ->withQueryString()
            ->through(fn (TuitionApplication $application) => [
                'id' => $application->id,
                'status' => $application->status,
                'admin_note' => $application->admin_note,
                'hired_at' => $application->hired_at,
                'commission_type' => $application->commission_type,
                'commission_value' => $application->commission_value,
                'commission_amount' => $application->commission_amount,
                'commission_received_amount' => $application->commission_received_amount,
                'commission_payment_status' => $application->commission_payment_status,
                'expected_salary' => $application->expected_salary,
                'cover_note' => $application->cover_note,
                'created_at' => $application->created_at,
                'tutor' => $application->tutor ? [
                    'id' => $application->tutor->id,
                    'name' => $application->tutor->name,
                    'email' => $application->tutor->email,
                    'phone' => $application->tutor->phone,
                    'university' => $application->tutor->tutorProfile?->university?->name,
                ] : null,
                'post' => $application->tuitionPost ? [
                    'id' => $application->tuitionPost->id,
                    'tuition_code' => $application->tuitionPost->tuition_code,
                    'title' => $application->tuitionPost->title,
                    'salary_type' => $application->tuitionPost->salary_type,
                    'salary_min' => $application->tuitionPost->salary_min,
                    'salary_max' => $application->tuitionPost->salary_max,
                ] : null,
                'guardian' => $application->tuitionPost?->guardian ? [
                    'id' => $application->tuitionPost->guardian->id,
                    'name' => $application->tuitionPost->guardian->name,
                    'email' => $application->tuitionPost->guardian->email,
                    'phone' => $application->tuitionPost->guardian->phone,
                ] : null,
            ]);

        return Inertia::render('admin/applications/index', [
            'applications' => $applications,
            'filters' => [
                'status' => $status,
                'tutor_id' => $tutorId > 0 ? (string) $tutorId : '',
                'tutor_label' => $tutorId > 0
                    ? (function () use ($tutorId) {
                        $tutor = User::find($tutorId, ['id', 'name', 'email']);

                        return $tutor ? "{$tutor->name} ({$tutor->email})" : '';
                    })()
                    : '',
                'university' => $university,
                'tuition_code' => $tuitionCode !== '' ? $tuitionCode : '',
            ],
            'statuses' => ['pending', 'shortlisted', 'interested', 'not_interested', 'rejected', 'hired'],
            'universities' => DB::table('tuition_applications')
                ->join('tutor_profiles', 'tuition_applications.tutor_id', '=', 'tutor_profiles.user_id')
                ->join('universities', 'tutor_profiles.university_id', '=', 'universities.id')
                ->whereNotNull('universities.name')
                ->distinct()
                ->orderBy('universities.name')
                ->pluck('universities.name')
                ->values(),
        ]);
    }

    public function bestMatch(Request $request): JsonResponse
    {
        $tuitionCode = strtoupper(str_replace('-', '', trim($request->string('tuition_code')->toString())));

        abort_if($tuitionCode === '', 422, 'A tuition code is required.');

        $post = TuitionPost::query()
            ->with(['students.subjects:id', 'preferredUniversities:id'])
            ->whereRaw('REPLACE(UPPER(tuition_code), "-", "") = ?', [$tuitionCode])
            ->first();

        abort_if($post === null, 404, 'Tuition post not found.');

        $applications = TuitionApplication::query()
            ->where('tuition_post_id', $post->id)
            ->whereIn('status', ['shortlisted', 'interested'])
            ->with([
                'tutor:id,name,gender',
                'tutor.tutorProfile.subjects:id',
                'tutor.tutorProfile.preferredLocations:id',
            ])
            ->get();

        return response()->json([
            'results' => TutorMatchScorer::scoreApplications($post, $applications),
        ]);
    }

    public function updateContactStatus(Request $request, TuitionApplication $application): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['shortlisted', 'rejected', 'interested', 'not_interested'])],
            'admin_note' => ['nullable', 'string', 'max:1000'],
        ]);

        $allowedTransitions = [
            'pending' => ['shortlisted', 'rejected'],
            'shortlisted' => ['interested', 'not_interested'],
        ];
        $currentStatus = $application->status;
        $nextStatus = $validated['status'];

        if (! isset($allowedTransitions[$currentStatus]) || ! in_array($nextStatus, $allowedTransitions[$currentStatus], true)) {
            return back()->with('toast', [
                'type' => 'error',
                'message' => 'Invalid status transition.',
            ]);
        }

        $application->update([
            'status' => $nextStatus,
            'admin_note' => $validated['admin_note'] ?? $application->admin_note,
        ]);

        // Notify guardian about application status change
        $tuitionPost = $application->tuitionPost;
        if ($tuitionPost && in_array($nextStatus, ['interested', 'not_interested'], true)) {
            $statusMessages = [
                'interested' => 'A shortlisted tutor is interested in your tuition post',
                'not_interested' => 'A shortlisted tutor is not interested in your tuition post',
            ];

            Notification::create([
                'user_id' => $tuitionPost->guardian_id,
                'type' => $nextStatus,
                'title' => $statusMessages[$nextStatus],
                'message' => 'Tutor: '.$application->tutor->name.' for "'.($tuitionPost->title ?? 'your tuition post').'".',
                'link' => '/guardian/tuition-posts/'.$tuitionPost->id.'/applications',
            ]);
        }

        // Update tuition post status based on application statuses
        if ($tuitionPost && $tuitionPost->status === 'published') {
            // Only change from 'published' to 'shortlisted' when applications are being processed
            $hasActiveApplications = TuitionApplication::where('tuition_post_id', $tuitionPost->id)
                ->whereIn('status', ['shortlisted', 'interested', 'not_interested'])
                ->exists();

            if ($hasActiveApplications) {
                $tuitionPost->update(['status' => 'shortlisted']);
            }
        }

        // Revert post to 'published' if all shortlisted candidates are rejected or not interested
        if ($tuitionPost && $tuitionPost->status === 'shortlisted') {
            $hasViableCandidates = TuitionApplication::where('tuition_post_id', $tuitionPost->id)
                ->whereIn('status', ['shortlisted', 'interested'])
                ->exists();

            if (! $hasViableCandidates) {
                $tuitionPost->update(['status' => 'published']);
            }
        }

        return back()->with('toast', [
            'type' => 'success',
            'message' => 'Application status updated.',
        ]);
    }

    public function updateCommissionPaymentStatus(Request $request, TuitionApplication $application): RedirectResponse
    {
        $validated = $request->validate([
            'commission_payment_status' => ['required', Rule::in(['unpaid', 'partial', 'paid'])],
        ]);

        if ($application->status !== 'hired') {
            return back()->with('toast', [
                'type' => 'error',
                'message' => 'Only hired applications can update commission payment status.',
            ]);
        }

        $total = max(0, (int) ($application->commission_amount ?? 0));
        $currentReceived = max(0, (int) ($application->commission_received_amount ?? 0));
        $nextPaymentStatus = $validated['commission_payment_status'];
        $nextReceivedAmount = $currentReceived;

        if ($nextPaymentStatus === 'unpaid') {
            $nextReceivedAmount = 0;
        } elseif ($nextPaymentStatus === 'paid') {
            $nextReceivedAmount = $total;
        } elseif ($nextPaymentStatus === 'partial') {
            if ($total <= 1) {
                $nextReceivedAmount = $total;
            } elseif ($currentReceived <= 0 || $currentReceived >= $total) {
                $nextReceivedAmount = max(1, (int) floor($total / 2));
            }
        }

        $application->update([
            'commission_payment_status' => $nextPaymentStatus,
            'commission_received_amount' => $nextReceivedAmount,
            'commission_paid_at' => $nextPaymentStatus === 'paid' ? now() : null,
            'commission_due_date' => null,
        ]);
        $application->tuitionPost?->update([
            'status' => $nextPaymentStatus === 'paid' ? 'completed' : 'assigned',
        ]);

        return back()->with('toast', [
            'type' => 'success',
            'message' => 'Commission payment status updated.',
        ]);
    }

    public function hire(Request $request, TuitionApplication $application): RedirectResponse
    {
        $validated = $request->validate([
            'commission_type' => ['required', Rule::in(['fixed', 'percentage'])],
            'commission_value' => ['required', 'numeric', 'min:0.01'],
            'commission_base_amount' => ['nullable', 'integer', 'min:1'],
            'commission_received_amount' => ['required', 'integer', 'min:1'],
            'commission_due_date' => ['nullable', 'date', 'after:today'],
        ]);

        if ($application->status !== 'interested') {
            return back()->with('toast', [
                'type' => 'error',
                'message' => 'Only interested applications can be hired.',
            ]);
        }

        DB::transaction(function () use ($request, $application, $validated): void {
            $commissionValue = (float) $validated['commission_value'];
            $commissionAmount = 0;

            if ($validated['commission_type'] === 'fixed') {
                $commissionAmount = (int) round($commissionValue);
            } else {
                $baseAmount = null;

                if ($application->expected_salary && $application->expected_salary > 0) {
                    $baseAmount = (int) $application->expected_salary;
                } elseif ($application->tuitionPost?->salary_type === 'fixed' && $application->tuitionPost->salary_min) {
                    $baseAmount = (int) $application->tuitionPost->salary_min;
                } elseif (! empty($validated['commission_base_amount'])) {
                    $baseAmount = (int) $validated['commission_base_amount'];
                }

                if (! $baseAmount || $baseAmount <= 0) {
                    abort(422, 'Base tuition amount is required for percentage commission.');
                }

                $commissionAmount = (int) round(($baseAmount * $commissionValue) / 100);
            }

            $receivedAmount = (int) $validated['commission_received_amount'];

            if ($receivedAmount > $commissionAmount) {
                abort(422, 'Received amount cannot exceed total commission.');
            }

            $alreadyHired = TuitionApplication::where('tuition_post_id', $application->tuition_post_id)
                ->where('status', 'hired')
                ->where('id', '!=', $application->id)
                ->exists();

            abort_if($alreadyHired, 409, 'This tuition post already has a hired tutor.');

            $application->update([
                'status' => 'hired',
                'hired_by' => $request->user()->id,
                'hired_at' => now(),
                'commission_type' => $validated['commission_type'],
                'commission_value' => $validated['commission_value'],
                'commission_amount' => $commissionAmount,
                'commission_received_amount' => $receivedAmount,
                'commission_payment_status' => $receivedAmount >= $commissionAmount ? 'paid' : 'partial',
                'commission_paid_at' => $receivedAmount >= $commissionAmount ? now() : null,
                'commission_due_date' => $receivedAmount >= $commissionAmount ? null : ($validated['commission_due_date'] ?? null),
            ]);

            CommissionPayment::create([
                'tuition_application_id' => $application->id,
                'amount' => $receivedAmount,
                'received_by' => $request->user()->id,
                'note' => 'Initial payment recorded at hiring.',
                'received_at' => now(),
                'due_on' => null,
            ]);

            $application->tuitionPost?->update([
                'status' => $receivedAmount >= $commissionAmount ? 'completed' : 'assigned',
            ]);

            // Auto-reject all other applications for this tuition post
            TuitionApplication::where('tuition_post_id', $application->tuition_post_id)
                ->where('id', '!=', $application->id)
                ->whereIn('status', ['pending', 'shortlisted', 'interested', 'not_interested'])
                ->update(['status' => 'rejected']);

            // Notify rejected applicants
            $rejectedApplications = TuitionApplication::where('tuition_post_id', $application->tuition_post_id)
                ->where('id', '!=', $application->id)
                ->where('status', 'rejected')
                ->get();

            foreach ($rejectedApplications as $rejectedApp) {
                Notification::create([
                    'user_id' => $rejectedApp->tutor_id,
                    'type' => 'rejected',
                    'title' => 'Position has been filled',
                    'message' => 'The tuition post "'.($application->tuitionPost?->title ?? 'a tuition post').'" has been filled by another tutor.',
                    'link' => '/tutor/applications',
                ]);
            }

            Notification::create([
                'user_id' => $application->tutor_id,
                'type' => 'hired',
                'title' => 'You have been hired',
                'message' => 'You were marked hired for "'.($application->tuitionPost?->title ?? 'a tuition post').'".',
                'link' => '/tutor/applications',
            ]);

            // Notify guardian about hiring
            if ($application->tuitionPost) {
                Notification::create([
                    'user_id' => $application->tuitionPost->guardian_id,
                    'type' => 'hired',
                    'title' => 'A tutor has been hired for your post',
                    'message' => 'Tutor: '.$application->tutor->name.' has been hired for "'.($application->tuitionPost->title ?? 'your tuition post').'".',
                    'link' => '/guardian/tuition-posts/'.$application->tuitionPost->id.'/applications',
                ]);
            }
        });

        return back()->with('toast', [
            'type' => 'success',
            'message' => 'Tutor hired successfully.',
        ]);
    }
}
