<?php

namespace App\Http\Controllers;

use App\Models\TuitionPost;
use App\Models\TutorProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TuitionJobController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = [
            'location' => trim($request->string('location')->toString()),
            'class_level' => trim($request->string('class_level')->toString()),
            'academic_group' => trim($request->string('academic_group')->toString()),
            'gender' => trim($request->string('gender')->toString()),
            'level' => trim($request->string('level')->toString()),
            'min_salary' => $request->integer('min_salary'),
            'max_days' => $request->integer('max_days'),
        ];

        $user = $request->user();
        $profile = $user && $user->role === User::ROLE_TUTOR
            ? $user->tutorProfile()->with(['subjects:id', 'preferredLocations:id,district_id'])->first()
            : null;
        $tabsAvailable = (bool) $profile;

        $savedIds = $tabsAvailable
            ? $user->savedTuitionPosts()->pluck('tuition_posts.id')->all()
            : [];

        $requested = $request->string('tab')->toString();
        $tab = in_array($requested, ['best', 'recent', 'saved'], true) ? $requested : ($tabsAvailable ? 'best' : 'recent');
        if (! $tabsAvailable && in_array($tab, ['best', 'saved'], true)) {
            $tab = 'recent';
        }

        $query = $this->baseQuery();
        $this->applyFilters($query, $filters);

        $scoreContext = null;

        if ($tab === 'best') {
            $score = $this->scoreExpression($profile);

            if ($score === null) {
                $tab = 'recent';
            } else {
                $scoreContext = $score['context'];
                $query->selectRaw("({$score['sql']}) as score", $score['bindings'])
                    ->where(function ($q) use ($user): void {
                        $q->where('tuition_posts.tutor_gender_preference', 'any');
                        if (in_array($user->gender, ['male', 'female'], true)) {
                            $q->orWhere('tuition_posts.tutor_gender_preference', $user->gender);
                        }
                    })
                    ->havingRaw('score > 0')
                    ->orderByDesc('score')
                    ->orderByDesc('tuition_posts.published_at')
                    ->orderByDesc('tuition_posts.id');
            }
        }

        if ($tab === 'saved') {
            $query->join('tutor_saved_posts', function ($join) use ($user): void {
                $join->on('tutor_saved_posts.tuition_post_id', '=', 'tuition_posts.id')
                    ->where('tutor_saved_posts.user_id', '=', $user->id);
            })->orderByDesc('tutor_saved_posts.created_at');
        }

        if ($tab === 'recent') {
            $query->latest('tuition_posts.published_at');
        }

        $posts = $query->paginate(12)->withQueryString();

        if ($scoreContext !== null) {
            $posts->setCollection(
                $this->attachReasons(
                    $posts->getCollection(),
                    $scoreContext['subjectIds'],
                    $scoreContext['prefSubdistrictIds'],
                    $scoreContext['classes'],
                )
            );
        }

        $locale = session('locale', config('app.locale'));
        app()->setLocale($locale);

        return Inertia::render('tuition-jobs/index', [
            'posts' => $posts,
            'tab' => $tab,
            'tabsAvailable' => $tabsAvailable,
            'savedIds' => $savedIds,
            'filters' => [
                'location' => $filters['location'],
                'class_level' => $filters['class_level'],
                'academic_group' => $filters['academic_group'],
                'gender' => in_array($filters['gender'], ['male', 'female', 'any'], true) ? $filters['gender'] : 'any',
                'level' => $filters['level'],
                'min_salary' => $filters['min_salary'] > 0 ? $filters['min_salary'] : null,
                'max_days' => $filters['max_days'] > 0 ? $filters['max_days'] : null,
            ],
            'locale' => $locale,
        ]);
    }

    /**
     * The shared base query (status, relations, location columns) used by every tab.
     */
    private function baseQuery(): Builder
    {
        return TuitionPost::query()
            ->whereIn('status', ['published', 'shortlisted'])
            ->with(['students.subjects:id,name', 'guardian:id,name'])
            ->join('districts', 'tuition_posts.district_id', '=', 'districts.id')
            ->join('subdistricts', 'tuition_posts.subdistrict_id', '=', 'subdistricts.id')
            ->select('tuition_posts.*', 'districts.name as district_name', 'subdistricts.name as subdistrict_name');
    }

    /**
     * Apply the request filter set, shared across all tabs.
     *
     * @param  array<string, mixed>  $filters
     */
    private function applyFilters(Builder $query, array $filters): void
    {
        $query
            ->when($filters['location'] !== '', function ($query) use ($filters): void {
                $query->where(function ($q) use ($filters): void {
                    $q->where('districts.name', 'like', "%{$filters['location']}%")
                        ->orWhere('subdistricts.name', 'like', "%{$filters['location']}%");
                });
            })
            ->when($filters['class_level'] !== '', function ($query) use ($filters): void {
                $query->whereHas('students', function ($studentQuery) use ($filters): void {
                    $studentQuery->where('class_level', $filters['class_level']);
                });
            })
            ->when($filters['academic_group'] !== '', function ($query) use ($filters): void {
                $query->whereHas('students', function ($studentQuery) use ($filters): void {
                    $studentQuery->where('academic_group', $filters['academic_group']);
                });
            })
            ->when(in_array($filters['gender'], ['male', 'female'], true), function ($query) use ($filters): void {
                $query->where('tuition_posts.tutor_gender_preference', $filters['gender']);
            })
            ->when($filters['level'] !== '', function ($query) use ($filters): void {
                $query->whereHas('students', function ($studentQuery) use ($filters): void {
                    $studentQuery->where('academic_level', $filters['level']);
                });
            })
            ->when($filters['min_salary'] > 0, function ($query) use ($filters): void {
                $query->where(function ($q) use ($filters): void {
                    $q->where('salary_type', 'negotiable')
                        ->orWhere('salary_min', '>=', $filters['min_salary'])
                        ->orWhere('salary_max', '>=', $filters['min_salary']);
                });
            })
            ->when($filters['max_days'] > 0, function ($query) use ($filters): void {
                $query->where('days_per_week', '<=', $filters['max_days']);
            });
    }

    /**
     * Build the weighted relevance score SQL for a tutor profile.
     * Returns null when the profile has nothing scorable.
     *
     * @return array{sql: string, bindings: array<int, mixed>, context: array<string, mixed>}|null
     */
    private function scoreExpression(?TutorProfile $profile): ?array
    {
        if (! $profile) {
            return null;
        }

        $subjectIds = $profile->subjects->pluck('id')->all();
        $prefSubdistrictIds = $profile->preferredLocations->pluck('id')->all();
        $prefDistrictIds = $profile->preferredLocations->pluck('district_id')->filter()->unique()->values()->all();
        $classes = $profile->teachable_classes ?? [];
        $levels = $profile->teachable_levels ?? [];
        $groups = $profile->teachable_groups ?? [];
        $mediums = $profile->teachable_mediums ?? [];

        $weights = config('ranking.weights');
        $bindings = [];
        $parts = [];

        $placeholders = static fn (array $items): string => implode(',', array_fill(0, count($items), '?'));

        // Location: preferred subdistrict (full) > same district (partial) > none.
        if ($prefSubdistrictIds !== []) {
            $part = 'CASE WHEN tuition_posts.subdistrict_id IN ('.$placeholders($prefSubdistrictIds).') THEN '.(int) $weights['location_full'];
            $bindings = array_merge($bindings, $prefSubdistrictIds);

            if ($prefDistrictIds !== []) {
                $part .= ' WHEN tuition_posts.district_id IN ('.$placeholders($prefDistrictIds).') THEN '.(int) $weights['location_district'];
                $bindings = array_merge($bindings, $prefDistrictIds);
            }

            $parts[] = $part.' ELSE 0 END';
        }

        // Subjects: number of distinct matching subjects across the post's students, capped at 3.
        if ($subjectIds !== []) {
            $parts[] = '(LEAST((SELECT COUNT(DISTINCT tpss.subject_id) FROM tuition_post_students tps '
                .'JOIN tuition_post_student_subject tpss ON tpss.tuition_post_student_id = tps.id '
                .'WHERE tps.tuition_post_id = tuition_posts.id AND tpss.subject_id IN ('.$placeholders($subjectIds).')), 3) * '.(int) $weights['subject'].')';
            $bindings = array_merge($bindings, $subjectIds);
        }

        $parts = array_merge($parts, $this->existsTerm('class_level', $classes, (int) $weights['class'], $placeholders, $bindings));
        $parts = array_merge($parts, $this->existsTerm('academic_level', $levels, (int) $weights['level'], $placeholders, $bindings));
        $parts = array_merge($parts, $this->existsTerm('academic_group', $groups, (int) $weights['group'], $placeholders, $bindings));
        $parts = array_merge($parts, $this->existsTerm('medium', $mediums, (int) $weights['medium'], $placeholders, $bindings));

        if ($parts === []) {
            return null;
        }

        return [
            'sql' => implode(' + ', $parts),
            'bindings' => $bindings,
            'context' => [
                'subjectIds' => $subjectIds,
                'prefSubdistrictIds' => $prefSubdistrictIds,
                'classes' => $classes,
            ],
        ];
    }

    /**
     * Build an EXISTS scoring term for a tuition_post_students column, appending its bindings.
     *
     * @param  array<int, string>  $values
     * @param  callable(array): string  $placeholders
     * @param  array<int, mixed>  $bindings
     * @return array<int, string>
     */
    private function existsTerm(string $column, array $values, int $weight, callable $placeholders, array &$bindings): array
    {
        if ($values === []) {
            return [];
        }

        $term = '(EXISTS(SELECT 1 FROM tuition_post_students tpe WHERE tpe.tuition_post_id = tuition_posts.id '
            ."AND tpe.{$column} IN (".$placeholders($values).")) * {$weight})";
        $bindings = array_merge($bindings, $values);

        return [$term];
    }

    /**
     * Attach human-readable match reasons to each best-match post for the "why" chips.
     *
     * @param  array<int, int>  $subjectIds
     * @param  array<int, int>  $prefSubdistrictIds
     * @param  array<int, string>  $classes
     */
    private function attachReasons(Collection $matches, array $subjectIds, array $prefSubdistrictIds, array $classes): Collection
    {
        return $matches->each(function (TuitionPost $post) use ($subjectIds, $prefSubdistrictIds, $classes): void {
            $postSubjectIds = $post->students
                ->flatMap(fn ($student) => $student->subjects->pluck('id'))
                ->unique();

            $post->setAttribute('match_reasons', [
                'in_area' => in_array($post->subdistrict_id, $prefSubdistrictIds, true),
                'subjects' => $postSubjectIds->intersect($subjectIds)->count(),
                'class_match' => $post->students
                    ->pluck('class_level')
                    ->filter()
                    ->intersect($classes)
                    ->isNotEmpty(),
            ]);
        });
    }
}
