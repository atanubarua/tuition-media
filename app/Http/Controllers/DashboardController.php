<?php

namespace App\Http\Controllers;

use App\Models\TuitionApplication;
use App\Models\TuitionPost;
use App\Models\TutorRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        $role = $user->role;

        if ($role === User::ROLE_ADMIN) {
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

            return Inertia::render('dashboard', [
                'role' => $role,
                'admin_dashboard' => [
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
                        'contactInterested' => TuitionApplication::where('status', 'interested')->count(),
                        'tutorRequestsPending' => TutorRequest::where('status', 'pending')->count(),
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
                    'recent_tutor_requests' => TutorRequest::query()
                        ->with(['guardian:id,name', 'tutor:id,name'])
                        ->latest()
                        ->get()
                        ->groupBy(fn (TutorRequest $requestRow) => $requestRow->request_group_id ?: "legacy-{$requestRow->id}")
                        ->map(function (Collection $group) {
                            /** @var TutorRequest $first */
                            $first = $group->first();

                            return [
                                'id' => $first->id,
                                'status' => $first->status,
                                'subject' => $group->map(fn (TutorRequest $requestRow) => trim('Class ' . ($requestRow->class_level ?? '-') . ($requestRow->academic_group ? " ({$requestRow->academic_group})" : '')))->filter()->join(', '),
                                'location' => $this->resolveLocationLabel($first->division_id, $first->district_id, $first->subdistrict_id),
                                'created_at' => $first->created_at,
                                'guardian' => $first->guardian ? [
                                    'id' => $first->guardian->id,
                                    'name' => $first->guardian->name,
                                ] : null,
                                'tutor' => $first->tutor ? [
                                    'id' => $first->tutor->id,
                                    'name' => $first->tutor->name,
                                ] : null,
                            ];
                        })
                        ->sortByDesc('created_at')
                        ->take(6)
                        ->values(),
                ],
            ]);
        }

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

        if ($role === User::ROLE_TUTOR) {
            $applicationsQuery = TuitionApplication::query()->where('tutor_id', $user->id);

            $stats = [
                'total_applications' => (clone $applicationsQuery)->count(),
                'pending_applications' => (clone $applicationsQuery)->where('status', 'pending')->count(),
                'shortlisted_applications' => (clone $applicationsQuery)->where('status', 'shortlisted')->count(),
                'hired_applications' => (clone $applicationsQuery)->where('status', 'hired')->count(),
            ];

            $recentApplications = TuitionApplication::query()
                ->where('tutor_id', $user->id)
                ->with('tuitionPost:id,title,status')
                ->latest()
                ->limit(8)
                ->get()
                ->map(fn (TuitionApplication $application) => [
                    'id' => $application->id,
                    'status' => $application->status,
                    'expected_salary' => $application->expected_salary,
                    'created_at' => $application->created_at,
                    'post' => [
                        'id' => $application->tuitionPost?->id,
                        'title' => $application->tuitionPost?->title,
                        'status' => $application->tuitionPost?->status,
                    ],
                ]);

            return Inertia::render('dashboard', [
                'role' => $role,
                'tutor_dashboard' => [
                    'stats' => $stats,
                    'recent_applications' => $recentApplications,
                ],
            ]);
        }

        return Inertia::render('dashboard', [
            'role' => $role,
        ]);
    }

    private function resolveLocationLabel(?int $divisionId, ?int $districtId, ?int $subdistrictId): ?string
    {
        if (! $divisionId && ! $districtId && ! $subdistrictId) {
            return null;
        }

        $division = $divisionId ? DB::table('divisions')->where('id', $divisionId)->value('name') : null;
        $district = $districtId ? DB::table('districts')->where('id', $districtId)->value('name') : null;
        $subdistrict = $subdistrictId ? DB::table('subdistricts')->where('id', $subdistrictId)->value('name') : null;

        return collect([$subdistrict, $district, $division])->filter()->implode(', ') ?: null;
    }
}
