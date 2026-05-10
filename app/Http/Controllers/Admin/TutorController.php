<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\University;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TutorController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();
        $gender = $request->string('gender')->toString();
        $university = $request->string('university')->toString();

        $universities = University::where('is_active', true)
            ->orderBy('name')
            ->get()
            ->map(fn ($university) => ['id' => $university->id, 'name' => $university->name]);

        $tutors = User::query()
            ->where('role', 'tutor')
            ->with([
                'tutorProfile.university',
            ])
            ->withCount([
                'tuitionApplications as applications_count',
                'tuitionApplications as pending_applications_count' => fn ($query) => $query->where('status', 'pending'),
                'tuitionApplications as shortlisted_applications_count' => fn ($query) => $query->where('status', 'shortlisted'),
                'tuitionApplications as hired_applications_count' => fn ($query) => $query->where('status', 'hired'),
                'tuitionApplications as rejected_applications_count' => fn ($query) => $query->where('status', 'rejected'),
            ])
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->when($gender !== '', fn ($query) => $query->where('gender', $gender))
            ->when($university !== '', function ($query) use ($university) {
                $universityModel = University::where('name', $university)->first();
                if ($universityModel) {
                    $query->whereHas('tutorProfile', fn ($q) => $q->where('university_id', $universityModel->id));
                }
            })
            ->latest()
            ->paginate(20)
            ->withQueryString()
            ->through(fn (User $tutor) => [
                'id' => $tutor->id,
                'name' => $tutor->name,
                'email' => $tutor->email,
                'phone' => $tutor->phone,
                'gender' => $tutor->gender,
                'has_profile' => (bool) $tutor->tutorProfile,
                'university' => $tutor->tutorProfile->university->name ?? null,
                'applications_count' => $tutor->applications_count,
                'applications_by_status' => [
                    'pending' => $tutor->pending_applications_count,
                    'shortlisted' => $tutor->shortlisted_applications_count,
                    'hired' => $tutor->hired_applications_count,
                    'rejected' => $tutor->rejected_applications_count,
                ],
                'created_at' => $tutor->created_at,
            ]);

        return Inertia::render('admin/tutors/index', [
            'tutors' => $tutors,
            'filters' => [
                'search' => $search,
                'gender' => $gender,
                'university' => $university,
            ],
            'genders' => ['male', 'female', 'other'],
            'universities' => $universities,
        ]);
    }

    public function search(Request $request): JsonResponse
    {
        $q = trim($request->string('q')->toString());

        $tutors = User::query()
            ->where('role', 'tutor')
            ->whereHas('tuitionApplications')
            ->when($q !== '', function ($query) use ($q) {
                $query->where(function ($inner) use ($q) {
                    $inner->where('name', 'like', "%{$q}%")
                        ->orWhere('email', 'like', "%{$q}%")
                        ->orWhere('phone', 'like', "%{$q}%");
                });
            })
            ->orderBy('name')
            ->limit(20)
            ->get(['id', 'name', 'email'])
            ->map(fn (User $tutor) => [
                'value' => (string) $tutor->id,
                'label' => "{$tutor->name} ({$tutor->email})",
            ]);

        return response()->json($tutors);
    }

    public function show(Request $request, User $tutor): Response
    {
        abort_unless($tutor->role === 'tutor', 404);

        $backUrl = '/admin/tutors';
        $returnTo = trim((string) $request->query('return_to', ''));
        if ($returnTo !== '') {
            if (str_starts_with($returnTo, '/admin/tutors')) {
                $backUrl = $returnTo;
            } else {
                $parsed = parse_url($returnTo);
                $path = $parsed['path'] ?? '';
                $query = isset($parsed['query']) ? ('?' . $parsed['query']) : '';

                if (str_starts_with($path, '/admin/tutors')) {
                    $backUrl = $path . $query;
                }
            }
        }

        $tutor->load([
            'tutorProfile' => fn ($query) => $query->with(['university:id,name', 'subjects:id,name', 'preferredLocations:id,district_id,name,type']),
            'tuitionApplications' => fn ($query) => $query->with(['tuitionPost:id,tuition_code,title,status'])->latest()->take(10),
        ]);

        $profile = $tutor->tutorProfile;

        return Inertia::render('admin/tutors/show', [
            'back_url' => $backUrl,
            'tutor' => [
                'id' => $tutor->id,
                'name' => $tutor->name,
                'email' => $tutor->email,
                'phone' => $tutor->phone,
                'gender' => $tutor->gender,
                'created_at' => $tutor->created_at,
                'profile' => $profile ? [
                    'occupation' => $profile->occupation,
                    'job_title' => $profile->job_title,
                    'job_organization' => $profile->job_organization,
                    'university' => $profile->university?->name ?? null,
                    'department' => $profile->department,
                    'academic_year' => $profile->academic_year,
                    'intake_year' => $profile->intake_year,
                    'teachable_levels' => $profile->teachable_levels ?? [],
                    'teachable_mediums' => $profile->teachable_mediums ?? [],
                    'experience_months' => $profile->experience_months,
                    'bio' => $profile->bio,
                    'profile_photo' => $profile->profile_photo,
                    'is_verified' => $profile->is_verified,
                    'subjects' => $profile->subjects->map(fn ($subject) => ['id' => $subject->id, 'name' => $subject->name]),
                    'preferred_locations' => $profile->preferredLocations->map(fn ($loc) => ['id' => $loc->id, 'name' => $loc->name]),
                ] : null,
            ],
            'recent_applications' => $tutor->tuitionApplications->map(fn ($app) => [
                'id' => $app->id,
                'status' => $app->status,
                'expected_salary' => $app->expected_salary,
                'created_at' => $app->created_at,
                'post' => $app->tuitionPost ? [
                    'id' => $app->tuitionPost->id,
                    'tuition_code' => $app->tuitionPost->tuition_code,
                    'title' => $app->tuitionPost->title,
                    'status' => $app->tuitionPost->status,
                ] : null,
            ]),
            'application_summary' => [
                'total' => $tutor->tuitionApplications()->count(),
                'pending' => $tutor->tuitionApplications()->where('status', 'pending')->count(),
                'shortlisted' => $tutor->tuitionApplications()->where('status', 'shortlisted')->count(),
                'hired' => $tutor->tuitionApplications()->where('status', 'hired')->count(),
                'rejected' => $tutor->tuitionApplications()->where('status', 'rejected')->count(),
            ],
        ]);
    }
}
