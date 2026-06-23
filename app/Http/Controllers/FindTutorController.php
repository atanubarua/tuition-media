<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FindTutorController extends Controller
{
    public function index(Request $request)
    {
        $classLevel = trim($request->string('class_level')->toString());
        $query = User::where('role', 'tutor')
            ->select(['id', 'name', 'gender'])
            ->whereHas('tutorProfile')
            ->with([
                'tutorProfile' => fn ($q) => $q->select([
                    'id',
                    'user_id',
                    'teachable_levels',
                    'teachable_classes',
                    'teachable_groups',
                    'teachable_mediums',
                    'experience_months',
                    'profile_photo',
                    'bio',
                    'is_verified',
                    'university_id',
                    'department',
                    'occupation',
                    'job_title',
                    'job_organization',
                    'academic_year',
                    'intake_year',
                ]),
                'tutorProfile.university:id,name',
                'tutorProfile.subjects:id,name',
                'tutorProfile.preferredLocations:id,name,type',
            ]);

        // Filter by gender
        if ($request->filled('gender') && $request->gender !== 'any') {
            $query->where('gender', $request->gender);
        }

        // Filter by location
        if ($request->filled('location')) {
            $location = $request->location;
            $query->whereHas('tutorProfile.preferredLocations', function ($q) use ($location) {
                $q->where('name', 'like', "%{$location}%");
            });
        }

        if ($classLevel !== '') {
            $query->whereHas('tutorProfile', function ($profileQuery) use ($classLevel, $request): void {
                $legacyMap = [
                    'nursery' => 'primary',
                    'kg' => 'primary',
                    '1' => 'primary',
                    '2' => 'primary',
                    '3' => 'primary',
                    '4' => 'primary',
                    '5' => 'primary',
                    '6' => 'high_school',
                    '7' => 'high_school',
                    '8' => 'high_school',
                    '9' => 'high_school',
                    '10' => 'high_school',
                    '11' => 'college',
                    '12' => 'college',
                ];

                $profileQuery->where(function ($q) use ($classLevel, $legacyMap): void {
                    $q->whereJsonContains('teachable_classes', $classLevel);
                });

                if (in_array($classLevel, ['9', '10', '11', '12'], true) && $request->filled('academic_group')) {
                    $profileQuery->whereJsonContains('teachable_groups', $request->string('academic_group')->toString());
                }
            });
        }

        // Filter by university
        if ($request->filled('university')) {
            $university = $request->university;
            $query->whereHas('tutorProfile.university', function ($q) use ($university) {
                $q->where('name', 'like', "%{$university}%");
            });
        }

        $tutors = $query->latest()->paginate(12)->withQueryString()
            ->through(fn (User $tutor) => [
                'id' => $tutor->id,
                'name' => $tutor->name,
                'gender' => $tutor->gender,
                'tutor_profile' => $tutor->tutorProfile ? [
                    'id' => $tutor->tutorProfile->id,
                    'teachable_levels' => $tutor->tutorProfile->teachable_levels,
                    'teachable_classes' => $tutor->tutorProfile->teachable_classes,
                    'teachable_groups' => $tutor->tutorProfile->teachable_groups,
                    'teachable_mediums' => $tutor->tutorProfile->teachable_mediums,
                    'experience_months' => $tutor->tutorProfile->experience_months,
                    'profile_photo' => $tutor->tutorProfile->profile_photo,
                    'bio' => $tutor->tutorProfile->bio,
                    'is_verified' => (bool) $tutor->tutorProfile->is_verified,
                    'university' => $tutor->tutorProfile->university ? [
                        'id' => $tutor->tutorProfile->university->id,
                        'name' => $tutor->tutorProfile->university->name,
                    ] : null,
                    'department' => $tutor->tutorProfile->department,
                    'occupation' => $tutor->tutorProfile->occupation,
                    'job_title' => $tutor->tutorProfile->job_title,
                    'job_organization' => $tutor->tutorProfile->job_organization,
                    'academic_year' => $tutor->tutorProfile->academic_year,
                    'intake_year' => $tutor->tutorProfile->intake_year,
                    'subjects' => $tutor->tutorProfile->subjects->map(fn ($subject) => [
                        'id' => $subject->id,
                        'name' => $subject->name,
                    ])->values(),
                    'preferred_locations' => $tutor->tutorProfile->preferredLocations->map(fn ($location) => [
                        'id' => $location->id,
                        'name' => $location->name,
                        'type' => $location->type,
                    ])->values(),
                ] : null,
            ]);

        $universities = \App\Models\University::orderBy('name')->get(['id', 'name']);

        $locale = session('locale', config('app.locale'));
        app()->setLocale($locale);

        return Inertia::render('FindTutors', [
            'tutors' => $tutors,
            'universities' => $universities,
            'divisions'    => \Illuminate\Support\Facades\DB::table('divisions')->select('id', 'name')->orderBy('name')->get(),
            'districts'    => \Illuminate\Support\Facades\DB::table('districts')->select('id', 'division_id', 'name')->orderBy('name')->get(),
            'subdistricts' => \Illuminate\Support\Facades\DB::table('subdistricts')->select('id', 'district_id', 'name', 'type')->orderBy('name')->get(),
            'filters' => [
                'location' => $request->location ?? '',
                'class_level' => $request->class_level ?? '',
                'academic_group' => $request->academic_group ?? '',
                'gender' => $request->gender ?? 'any',
                'university' => $request->university ?? '',
            ],
            'locale' => $locale,
            'translations' => trans($locale),
        ]);
    }
}
