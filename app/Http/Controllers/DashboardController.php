<?php

namespace App\Http\Controllers;

use App\Models\TuitionApplication;
use App\Models\TuitionPost;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        $role = $user->role;

        if ($role === User::ROLE_GUARDIAN) {
            $postIds = TuitionPost::query()
                ->where('guardian_id', $user->id)
                ->pluck('id');

            $stats = [
                'total_posts' => $postIds->count(),
                'published_posts' => TuitionPost::query()
                    ->where('guardian_id', $user->id)
                    ->where('status', 'published')
                    ->count(),
                'total_applications' => TuitionApplication::query()
                    ->whereIn('tuition_post_id', $postIds)
                    ->count(),
                'pending_applications' => TuitionApplication::query()
                    ->whereIn('tuition_post_id', $postIds)
                    ->where('status', 'pending')
                    ->count(),
            ];

            $recentPosts = TuitionPost::query()
                ->where('guardian_id', $user->id)
                ->withCount('applications')
                ->latest()
                ->limit(5)
                ->get(['id', 'title', 'status', 'created_at']);

            $recentApplications = TuitionApplication::query()
                ->whereIn('tuition_post_id', $postIds)
                ->with(['tuitionPost:id,title', 'tutor:id,name'])
                ->latest()
                ->limit(8)
                ->get()
                ->map(fn (TuitionApplication $application) => [
                    'id' => $application->id,
                    'status' => $application->status,
                    'created_at' => $application->created_at,
                    'post' => [
                        'id' => $application->tuitionPost?->id,
                        'title' => $application->tuitionPost?->title,
                    ],
                    'tutor' => [
                        'id' => $application->tutor?->id,
                        'name' => $application->tutor?->name,
                    ],
                ]);

            return Inertia::render('dashboard', [
                'role' => $role,
                'guardian_dashboard' => [
                    'stats' => $stats,
                    'recent_posts' => $recentPosts,
                    'recent_applications' => $recentApplications,
                ],
            ]);
        }

        return Inertia::render('dashboard', [
            'role' => $role,
        ]);
    }
}
