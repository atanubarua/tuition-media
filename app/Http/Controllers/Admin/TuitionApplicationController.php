<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\TuitionApplication;
use App\Models\User;
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
        $tuitionCode = strtoupper(str_replace('-', '', trim($request->string('tuition_code')->toString())));

        $applications = TuitionApplication::query()
            ->with([
                'tutor:id,name,email',
                'tuitionPost:id,tuition_code,title,guardian_id',
                'tuitionPost.guardian:id,name,email',
            ])
            ->when($status !== '', fn ($query) => $query->where('status', $status))
            ->when($tutorId > 0, fn ($query) => $query->where('tutor_id', $tutorId))
            ->when($tuitionCode !== '', function ($query) use ($tuitionCode) {
                $query->whereHas('tuitionPost', function ($postQuery) use ($tuitionCode): void {
                    $postQuery->whereRaw('REPLACE(UPPER(tuition_code), "-", "") = ?', [$tuitionCode]);
                });
            })
            ->latest()
            ->get()
            ->map(fn (TuitionApplication $application) => [
                'id' => $application->id,
                'status' => $application->status,
                'admin_contact_status' => $application->admin_contact_status ?? 'new',
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
                ] : null,
            ]);

        return Inertia::render('admin/applications/index', [
            'applications' => $applications,
            'filters' => [
                'status' => $status,
                'tutor_id' => $tutorId > 0 ? (string) $tutorId : '',
                'tuition_code' => $tuitionCode !== '' ? $tuitionCode : '',
            ],
            'statuses' => ['pending', 'shortlisted', 'rejected', 'hired'],
            'contactStatuses' => ['new', 'contacted', 'interested', 'not_interested'],
            'tutors' => User::query()
                ->where('role', 'tutor')
                ->whereHas('tuitionApplications')
                ->orderBy('name')
                ->get(['id', 'name', 'email'])
                ->map(fn (User $tutor) => [
                    'id' => $tutor->id,
                    'name' => $tutor->name,
                    'email' => $tutor->email,
                ]),
        ]);
    }

    public function updateContactStatus(Request $request, TuitionApplication $application): RedirectResponse
    {
        $validated = $request->validate([
            'admin_contact_status' => ['required', Rule::in(['new', 'contacted', 'interested', 'not_interested'])],
            'admin_note' => ['nullable', 'string', 'max:1000'],
        ]);

        $application->update($validated);

        return back()->with('toast', [
            'type' => 'success',
            'message' => 'Contact status updated.',
        ]);
    }

    public function hire(Request $request, TuitionApplication $application): RedirectResponse
    {
        $validated = $request->validate([
            'commission_type' => ['required', Rule::in(['fixed', 'percentage'])],
            'commission_value' => ['required', 'numeric', 'min:0.01'],
            'commission_base_amount' => ['nullable', 'integer', 'min:1'],
        ]);

        if ($application->status !== 'shortlisted') {
            return back()->with('toast', [
                'type' => 'error',
                'message' => 'Only shortlisted applications can be hired.',
            ]);
        }

        if ($application->admin_contact_status !== 'interested') {
            return back()->with('toast', [
                'type' => 'error',
                'message' => 'Set contact status to interested before hiring.',
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
                'commission_received_amount' => 0,
                'commission_payment_status' => 'unpaid',
                'commission_paid_at' => null,
            ]);

            $application->tuitionPost?->update([
                'status' => 'assigned',
            ]);

            Notification::create([
                'user_id' => $application->tutor_id,
                'type' => 'hired',
                'title' => 'You have been hired',
                'message' => 'You were marked hired for "' . ($application->tuitionPost?->title ?? 'a tuition post') . '".',
                'link' => '/tutor/applications',
            ]);
        });

        return back()->with('toast', [
            'type' => 'success',
            'message' => 'Tutor hired successfully.',
        ]);
    }
}
