<?php

namespace App\Http\Controllers\Guardian;

use App\Http\Controllers\Controller;
use App\Models\TuitionApplication;
use App\Models\TuitionPost;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class TuitionApplicationController extends Controller
{
    public function index(Request $request, TuitionPost $tuitionPost): Response
    {
        abort_unless($request->user()->role === 'guardian', 403);
        abort_unless($tuitionPost->guardian_id === $request->user()->id, 403);

        $status = $request->string('status')->toString();
        $search = trim($request->string('search')->toString());
        $university = trim($request->string('university')->toString());

        $applications = TuitionApplication::query()
            ->with([
                'tutor.tutorProfile.university:id,name',
                'tutor.tutorProfile.subjects:id,name',
            ])
            ->where('tuition_post_id', $tuitionPost->id)
            ->when(
                $status !== '' && in_array($status, ['pending', 'shortlisted', 'interested', 'not_interested', 'rejected', 'hired'], true),
                fn ($query) => $query->where('status', $status)
            )
            ->when($search !== '', function ($query) use ($search): void {
                $query->whereHas('tutor', function ($tutorQuery) use ($search): void {
                    $tutorQuery->where('name', 'like', '%' . $search . '%');
                });
            })
            ->when($university !== '', function ($query) use ($university): void {
                $query->whereHas('tutor.tutorProfile.university', fn ($universityQuery) => $universityQuery->where('name', $university));
            })
            ->latest()
            ->paginate(10)
            ->withQueryString()
            ->through(fn ($app) => [
                'id' => $app->id,
                'status' => $app->status,
                'cover_note' => $app->cover_note,
                'expected_salary' => $app->expected_salary,
                'created_at' => $app->created_at,
                'tutor' => [
                    'id' => $app->tutor->id,
                    'name' => $app->tutor->name,
                    'gender' => $app->tutor->gender,
                    'profile' => $app->tutor->tutorProfile ? [
                        'university' => $app->tutor->tutorProfile->university?->name,
                        'department' => $app->tutor->tutorProfile->department,
                        'academic_year' => $app->tutor->tutorProfile->academic_year,
                        'intake_year' => $app->tutor->tutorProfile->intake_year,
                        'occupation' => $app->tutor->tutorProfile->occupation,
                        'job_title' => $app->tutor->tutorProfile->job_title,
                        'job_organization' => $app->tutor->tutorProfile->job_organization,
                        'teachable_levels' => $app->tutor->tutorProfile->teachable_levels ?? [],
                        'teachable_mediums' => $app->tutor->tutorProfile->teachable_mediums ?? [],
                        'experience_months' => $app->tutor->tutorProfile->experience_months,
                        'subjects' => $app->tutor->tutorProfile->subjects->pluck('name'),
                        'bio' => $app->tutor->tutorProfile->bio,
                    ] : null,
                ],
            ]);

        $universities = TuitionApplication::query()
            ->with('tutor.tutorProfile.university:id,name')
            ->where('tuition_post_id', $tuitionPost->id)
            ->get()
            ->pluck('tutor.tutorProfile.university.name')
            ->filter(fn ($name) => filled($name))
            ->map(fn ($name) => Str::of($name)->trim()->toString())
            ->unique()
            ->sort()
            ->values();

        return Inertia::render('guardian/tuition-posts/applications', [
            'post' => ['id' => $tuitionPost->id, 'title' => $tuitionPost->title],
            'applications' => $applications,
            'filters' => [
                'status' => $status,
                'search' => $search,
                'university' => $university,
            ],
            'universities' => $universities,
        ]);
    }

    public function updateStatus(Request $request, TuitionPost $tuitionPost, TuitionApplication $application): \Illuminate\Http\RedirectResponse
    {
        abort_unless($request->user()->role === 'guardian', 403);
        abort_unless($tuitionPost->guardian_id === $request->user()->id, 403);
        abort_unless($application->tuition_post_id === $tuitionPost->id, 403);

        $validated = $request->validate([
            'status' => ['required', 'in:shortlisted,rejected'],
        ]);

        $application->update($validated);

        $statusLabels = [
            'shortlisted' => 'You have been shortlisted',
            'rejected'    => 'Your application was not selected',
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
