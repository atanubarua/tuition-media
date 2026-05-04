<?php

namespace App\Http\Controllers\Tutor;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\TuitionApplication;
use App\Models\TuitionPost;
use App\Models\TutorProfile;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TuitionApplicationController extends Controller
{
    public function store(Request $request, TuitionPost $tuitionPost): RedirectResponse
    {
        abort_unless($request->user()->role === 'tutor', 403);
        abort_unless($tuitionPost->status === 'published', 404);

        $hasProfile = TutorProfile::where('user_id', $request->user()->id)->exists();
        abort_unless($hasProfile, 403, 'Please complete your tutor profile before applying.');

        $alreadyApplied = TuitionApplication::where('tuition_post_id', $tuitionPost->id)
            ->where('tutor_id', $request->user()->id)
            ->exists();

        abort_if($alreadyApplied, 409, 'You have already applied for this tuition.');

        $validated = $request->validate([
            'cover_note' => ['nullable', 'string', 'max:1000'],
            'expected_salary' => ['nullable', 'integer', 'min:0', 'max:999999'],
        ]);

        TuitionApplication::create([
            'tuition_post_id' => $tuitionPost->id,
            'tutor_id' => $request->user()->id,
            'cover_note' => $validated['cover_note'] ?? null,
            'expected_salary' => $validated['expected_salary'] ?? null,
        ]);

        $postTitle = $tuitionPost->title ?? 'a tuition post';

        // Notify the guardian
        Notification::create([
            'user_id' => $tuitionPost->guardian_id,
            'type' => 'new_application',
            'title' => 'New Application Received',
            'message' => $request->user()->name . ' applied for "' . $postTitle . '".',
            'link' => '/guardian/tuition-posts/' . $tuitionPost->id . '/applications',
        ]);

        return back()->with('toast', [
            'type' => 'success',
            'message' => 'Application submitted successfully!',
        ]);
    }

    public function index(Request $request): Response
    {
        abort_unless($request->user()->role === 'tutor', 403);

        $applications = TuitionApplication::with(['tuitionPost'])
            ->where('tutor_id', $request->user()->id)
            ->latest()
            ->get()
            ->map(fn($app) => [
                'id' => $app->id,
                'status' => $app->status,
                'expected_salary' => $app->expected_salary,
                'created_at' => $app->created_at,
                'post' => [
                    'id' => $app->tuitionPost?->id,
                    'title' => $app->tuitionPost?->title,
                    'status' => $app->tuitionPost?->status,
                ],
            ]);

        return Inertia::render('tutor/applications/index', [
            'applications' => $applications,
        ]);
    }
}
