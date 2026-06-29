<?php

namespace App\Http\Controllers;

use App\Models\University;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class FindTutorController extends Controller
{
    public function index(Request $request)
    {
        $classLevel = trim($request->string('class_level')->toString());

        $context = $this->guardianContext($request->user());
        $personalized = $context !== null;

        $query = User::where('role', 'tutor')
            ->select(['users.id', 'users.name', 'users.gender'])
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

                $profileQuery->where(function ($q) use ($classLevel): void {
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

        if ($personalized) {
            $this->applyRanking($query, $context);
        } else {
            $query->latest();
        }

        $tutors = $query->paginate(12)->withQueryString()
            ->through(fn (User $tutor) => [
                'id' => $tutor->id,
                'name' => $tutor->name,
                'gender' => $tutor->gender,
                'match_reasons' => $personalized ? $this->matchReasons($tutor, $context) : null,
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

        $universities = University::orderBy('name')->get(['id', 'name']);

        $locale = session('locale', config('app.locale'));
        app()->setLocale($locale);

        return Inertia::render('FindTutors', [
            'tutors' => $tutors,
            'personalized' => $personalized,
            'showPostNudge' => $request->user()?->role === 'guardian' && ! $personalized,
            'universities' => $universities,
            'divisions' => DB::table('divisions')->select('id', 'name')->orderBy('name')->get(),
            'districts' => DB::table('districts')->select('id', 'division_id', 'name')->orderBy('name')->get(),
            'subdistricts' => DB::table('subdistricts')->select('id', 'district_id', 'name', 'type')->orderBy('name')->get(),
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

    /**
     * Aggregate a guardian's tuition posts into a ranking context.
     * Returns null for non-guardians or guardians with no usable signal.
     *
     * @return array<string, array<int, mixed>>|null
     */
    private function guardianContext(?User $user): ?array
    {
        if (! $user || $user->role !== 'guardian') {
            return null;
        }

        $posts = $user->tuitionPosts()
            ->select(['id', 'district_id', 'subdistrict_id'])
            ->with(['students:id,tuition_post_id,class_level,academic_group,medium', 'students.subjects:id'])
            ->get();

        if ($posts->isEmpty()) {
            return null;
        }

        $students = $posts->flatMap->students;

        $context = [
            'subdistrictIds' => $posts->pluck('subdistrict_id')->filter()->unique()->values()->all(),
            'districtIds' => $posts->pluck('district_id')->filter()->unique()->values()->all(),
            'subjectIds' => $students->flatMap(fn ($s) => $s->subjects->pluck('id'))->unique()->values()->all(),
            'classes' => $students->pluck('class_level')->filter()->unique()->values()->all(),
            'groups' => $students->pluck('academic_group')->filter()->unique()->values()->all(),
            'mediums' => $students->pluck('medium')->filter()->unique()->values()->all(),
        ];

        // Need at least a location or subject signal to rank meaningfully.
        if ($context['subdistrictIds'] === [] && $context['subjectIds'] === []) {
            return null;
        }

        return $context;
    }

    /**
     * Add a weighted relevance score and ordering to the tutor query.
     *
     * @param  array<string, array<int, mixed>>  $context
     */
    private function applyRanking($query, array $context): void
    {
        $weights = config('ranking.tutor_weights');
        $bindings = [];
        $parts = [];

        $placeholders = static fn (array $items): string => implode(',', array_fill(0, count($items), '?'));

        // Location: preferred subdistrict (full) > same district (partial) > none.
        if ($context['subdistrictIds'] !== []) {
            $part = 'CASE WHEN EXISTS(SELECT 1 FROM tutor_preferred_locations tpl WHERE tpl.tutor_profile_id = tp.id '
                .'AND tpl.subdistrict_id IN ('.$placeholders($context['subdistrictIds']).')) THEN '.(int) $weights['location_full'];
            $bindings = array_merge($bindings, $context['subdistrictIds']);

            if ($context['districtIds'] !== []) {
                $part .= ' WHEN EXISTS(SELECT 1 FROM tutor_preferred_locations tpl '
                    .'JOIN subdistricts sd ON sd.id = tpl.subdistrict_id '
                    .'WHERE tpl.tutor_profile_id = tp.id AND sd.district_id IN ('.$placeholders($context['districtIds']).')) THEN '.(int) $weights['location_district'];
                $bindings = array_merge($bindings, $context['districtIds']);
            }

            $parts[] = $part.' ELSE 0 END';
        }

        // Subjects: distinct matching subjects, capped at 3.
        if ($context['subjectIds'] !== []) {
            $parts[] = '(LEAST((SELECT COUNT(DISTINCT ts.subject_id) FROM tutor_subjects ts '
                .'WHERE ts.tutor_profile_id = tp.id AND ts.subject_id IN ('.$placeholders($context['subjectIds']).')), 3) * '.(int) $weights['subject'].')';
            $bindings = array_merge($bindings, $context['subjectIds']);
        }

        $parts = array_merge($parts, $this->jsonOverlapTerm('tp.teachable_classes', $context['classes'], (int) $weights['class'], $bindings));
        $parts = array_merge($parts, $this->jsonOverlapTerm('tp.teachable_groups', $context['groups'], (int) $weights['group'], $bindings));
        $parts = array_merge($parts, $this->jsonOverlapTerm('tp.teachable_mediums', $context['mediums'], (int) $weights['medium'], $bindings));

        // Quality: small boost for verified tutors.
        $parts[] = '(tp.is_verified * '.(int) $weights['verified'].')';

        $scoreSql = implode(' + ', $parts);

        $query->join('tutor_profiles as tp', 'tp.user_id', '=', 'users.id')
            ->selectRaw("({$scoreSql}) as score", $bindings)
            ->orderByDesc('score')
            ->orderByDesc('tp.is_verified')
            ->orderByDesc('tp.experience_months')
            ->orderByDesc('users.id');
    }

    /**
     * Build a JSON_OVERLAPS scoring term for a tutor_profiles JSON-array column.
     *
     * @param  array<int, string>  $values
     * @param  array<int, mixed>  $bindings
     * @return array<int, string>
     */
    private function jsonOverlapTerm(string $column, array $values, int $weight, array &$bindings): array
    {
        if ($values === []) {
            return [];
        }

        $bindings[] = json_encode(array_values($values));

        return ["(COALESCE(JSON_OVERLAPS({$column}, CAST(? AS JSON)), 0) * {$weight})"];
    }

    /**
     * Compute human-readable match reasons for a tutor from the guardian context.
     *
     * @param  array<string, array<int, mixed>>  $context
     * @return array<string, mixed>
     */
    private function matchReasons(User $tutor, array $context): array
    {
        $profile = $tutor->tutorProfile;

        return [
            'in_area' => $profile->preferredLocations->pluck('id')->intersect($context['subdistrictIds'])->isNotEmpty(),
            'subjects' => $profile->subjects->pluck('id')->intersect($context['subjectIds'])->count(),
            'class_match' => collect($profile->teachable_classes ?? [])->intersect($context['classes'])->isNotEmpty(),
        ];
    }
}
