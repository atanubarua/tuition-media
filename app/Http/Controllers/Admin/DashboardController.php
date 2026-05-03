<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TuitionApplication;
use App\Models\TuitionPost;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $recentPosts = TuitionPost::query()
            ->with(['guardian:id,name'])
            ->withCount('applications')
            ->latest()
            ->limit(6)
            ->get(['id', 'tuition_code', 'title', 'status', 'guardian_id', 'created_at'])
            ->map(fn (TuitionPost $post) => [
                'id' => $post->id,
                'tuition_code' => $post->tuition_code,
                'title' => $post->title,
                'status' => $post->status,
                'applications_count' => $post->applications_count,
                'created_at' => $post->created_at,
                'guardian' => $post->guardian ? [
                    'id' => $post->guardian->id,
                    'name' => $post->guardian->name,
                ] : null,
            ]);

        $recentApplications = TuitionApplication::query()
            ->with([
                'tuitionPost:id,tuition_code,title',
                'tutor:id,name',
            ])
            ->latest()
            ->limit(8)
            ->get()
            ->map(fn (TuitionApplication $application) => [
                'id' => $application->id,
                'status' => $application->status,
                'admin_contact_status' => $application->admin_contact_status ?? 'new',
                'commission_payment_status' => $application->status === 'hired'
                    ? $application->commission_payment_status
                    : null,
                'created_at' => $application->created_at,
                'post' => $application->tuitionPost ? [
                    'id' => $application->tuitionPost->id,
                    'tuition_code' => $application->tuitionPost->tuition_code,
                    'title' => $application->tuitionPost->title,
                ] : null,
                'tutor' => $application->tutor ? [
                    'id' => $application->tutor->id,
                    'name' => $application->tutor->name,
                ] : null,
            ]);

        return Inertia::render('admin/dashboard', [
            'stats' => [
                'guardians' => User::where('role', User::ROLE_GUARDIAN)->count(),
                'tutors' => User::where('role', User::ROLE_TUTOR)->count(),
                'tuitionPosts' => TuitionPost::count(),
                'applications' => TuitionApplication::count(),
                'publishedPosts' => TuitionPost::where('status', 'published')->count(),
                'assignedPosts' => TuitionPost::where('status', 'assigned')->count(),
                'pendingApplications' => TuitionApplication::where('status', 'pending')->count(),
                'shortlistedApplications' => TuitionApplication::where('status', 'shortlisted')->count(),
                'hiredApplications' => TuitionApplication::where('status', 'hired')->count(),
                'contactInterested' => TuitionApplication::where('admin_contact_status', 'interested')->count(),
                'commissionUnpaid' => TuitionApplication::where('status', 'hired')
                    ->where('commission_payment_status', 'unpaid')
                    ->count(),
                'commissionPartial' => TuitionApplication::where('status', 'hired')
                    ->where('commission_payment_status', 'partial')
                    ->count(),
                'commissionDueAmount' => (int) TuitionApplication::where('status', 'hired')
                    ->selectRaw('COALESCE(SUM(GREATEST(commission_amount - commission_received_amount, 0)), 0) as due')
                    ->value('due'),
            ],
            'recent_posts' => $recentPosts,
            'recent_applications' => $recentApplications,
        ]);
    }
}
