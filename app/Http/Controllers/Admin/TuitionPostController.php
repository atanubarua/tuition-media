<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TuitionPost;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TuitionPostController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->string('status')->toString();

        $posts = TuitionPost::query()
            ->withCount([
                'students',
                'applications',
                'applications as pending_applications_count' => fn ($query) => $query->where('status', 'pending'),
                'applications as shortlisted_applications_count' => fn ($query) => $query->where('status', 'shortlisted'),
                'applications as rejected_applications_count' => fn ($query) => $query->where('status', 'rejected'),
                'applications as hired_applications_count' => fn ($query) => $query->where('status', 'hired'),
            ])
            ->with(['guardian:id,name,email'])
            ->when($status !== '', fn ($query) => $query->where('status', $status))
            ->latest()
            ->get()
            ->map(fn (TuitionPost $post) => [
                'id' => $post->id,
                'tuition_code' => $post->tuition_code,
                'title' => $post->title,
                'status' => $post->status,
                'salary_type' => $post->salary_type,
                'salary_min' => $post->salary_min,
                'salary_max' => $post->salary_max,
                'days_per_week' => $post->days_per_week,
                'students_count' => $post->students_count,
                'applications_count' => $post->applications_count,
                'application_status_counts' => [
                    'pending' => $post->pending_applications_count,
                    'shortlisted' => $post->shortlisted_applications_count,
                    'rejected' => $post->rejected_applications_count,
                    'hired' => $post->hired_applications_count,
                ],
                'guardian' => $post->guardian ? [
                    'id' => $post->guardian->id,
                    'name' => $post->guardian->name,
                    'email' => $post->guardian->email,
                ] : null,
                'created_at' => $post->created_at,
            ]);

        return Inertia::render('admin/tuition-posts/index', [
            'posts' => $posts,
            'filters' => [
                'status' => $status,
            ],
            'statuses' => ['draft', 'published', 'shortlisted', 'assigned', 'completed', 'closed', 'cancelled'],
        ]);
    }
}
