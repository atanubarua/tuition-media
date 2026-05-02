<?php

namespace App\Http\Controllers\Guardian;

use App\Http\Controllers\Controller;
use App\Models\TuitionApplication;
use App\Models\TuitionPost;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TuitionApplicationController extends Controller
{
    public function index(Request $request, TuitionPost $tuitionPost): Response
    {
        abort_unless($request->user()->role === 'guardian', 403);
        abort_unless($tuitionPost->guardian_id === $request->user()->id, 403);

        $applications = TuitionApplication::with(['tutor.tutorProfile.university'])
            ->where('tuition_post_id', $tuitionPost->id)
            ->latest()
            ->get()
            ->map(fn($app) => [
                'id' => $app->id,
                'status' => $app->status,
                'cover_note' => $app->cover_note,
                'expected_salary' => $app->expected_salary,
                'created_at' => $app->created_at,
                'tutor' => [
                    'id' => $app->tutor->id,
                    'name' => $app->tutor->name,
                    'email' => $app->tutor->email,
                    'phone' => $app->tutor->phone,
                    'gender' => $app->tutor->gender,
                    'profile' => $app->tutor->tutorProfile ? [
                        'university' => $app->tutor->tutorProfile->university?->name,
                        'department' => $app->tutor->tutorProfile->department,
                        'experience_months' => $app->tutor->tutorProfile->experience_months,
                        'bio' => $app->tutor->tutorProfile->bio,
                    ] : null,
                ],
            ]);

        return Inertia::render('guardian/tuition-posts/applications', [
            'post' => ['id' => $tuitionPost->id, 'title' => $tuitionPost->title],
            'applications' => $applications,
        ]);
    }

    public function updateStatus(Request $request, TuitionPost $tuitionPost, TuitionApplication $application): \Illuminate\Http\RedirectResponse
    {
        abort_unless($request->user()->role === 'guardian', 403);
        abort_unless($tuitionPost->guardian_id === $request->user()->id, 403);
        abort_unless($application->tuition_post_id === $tuitionPost->id, 403);

        $validated = $request->validate([
            'status' => ['required', 'in:pending,shortlisted,rejected,hired'],
        ]);

        $application->update($validated);

        $statusLabels = [
            'shortlisted' => 'You have been shortlisted',
            'rejected'    => 'Your application was not selected',
            'hired'       => 'Congratulations! You have been hired',
        ];

        if (isset($statusLabels[$validated['status']])) {
            $postTitle = $tuitionPost->title ?? 'a tuition post';
            \App\Models\Notification::create([
                'user_id' => $application->tutor_id,
                'type'    => $validated['status'],
                'title'   => $statusLabels[$validated['status']],
                'message' => 'Regarding "' . $postTitle . '".',
                'link'    => '/tutor/applications',
            ]);
        }

        return back()->with('toast', ['type' => 'success', 'message' => 'Application status updated.']);
    }
}
