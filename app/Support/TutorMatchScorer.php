<?php

namespace App\Support;

use App\Models\TuitionApplication;
use App\Models\TuitionPost;
use Illuminate\Support\Collection;

/**
 * Deterministic, explainable scoring of tutor applications against a tuition post.
 *
 * Produces a 0-100 match score per application together with a per-factor
 * breakdown so the UI can show "why" a tutor ranks where it does.
 */
class TutorMatchScorer
{
    /**
     * Weight (out of 100) assigned to each scoring factor.
     */
    private const WEIGHTS = [
        'subjects' => 30,
        'location' => 20,
        'salary' => 15,
        'class_group_medium' => 15,
        'experience' => 10,
        'university' => 10,
    ];

    /**
     * Gender-preference mismatch multiplier applied to the final score.
     */
    private const GENDER_MISMATCH_MULTIPLIER = 0.7;

    /**
     * @param  Collection<int, TuitionApplication>  $applications
     * @return array<int, array{application_id:int, tutor_id:int|null, tutor_name:string|null, score:int, factors:array<int, array{key:string, label:string, score:float, weight:int, detail:string}>}>
     */
    public static function scoreApplications(TuitionPost $post, Collection $applications): array
    {
        $requiredSubjectIds = $post->students
            ->flatMap(fn ($student) => $student->subjects->pluck('id'))
            ->unique()
            ->values();

        $studentClassLevels = $post->students->pluck('class_level')->filter()->unique()->values();
        $studentGroups = $post->students->pluck('academic_group')->filter()->unique()->values();
        $studentMediums = $post->students->pluck('medium')->filter()->unique()->values();
        $preferredUniversityIds = $post->preferredUniversities->pluck('id');

        $results = $applications->map(function (TuitionApplication $application) use (
            $post,
            $requiredSubjectIds,
            $studentClassLevels,
            $studentGroups,
            $studentMediums,
            $preferredUniversityIds,
        ): array {
            $profile = $application->tutor?->tutorProfile;

            $factors = [
                self::scoreSubjects($profile, $requiredSubjectIds),
                self::scoreLocation($profile, $post),
                self::scoreSalary($application, $post),
                self::scoreClassGroupMedium($profile, $studentClassLevels, $studentGroups, $studentMediums),
                self::scoreExperience($profile, $post),
                self::scoreUniversity($profile, $preferredUniversityIds),
            ];

            $weighted = array_sum(array_map(
                fn (array $factor): float => $factor['score'] * $factor['weight'],
                $factors,
            ));
            $totalWeight = array_sum(self::WEIGHTS);

            $score = $totalWeight > 0 ? ($weighted / $totalWeight) * 100 : 0.0;
            $score *= self::genderMultiplier($post, $application);

            return [
                'application_id' => $application->id,
                'tutor_id' => $application->tutor?->id,
                'tutor_name' => $application->tutor?->name,
                'score' => (int) round($score),
                'factors' => $factors,
            ];
        });

        return $results
            ->sortByDesc('score')
            ->values()
            ->all();
    }

    /**
     * @return array{key:string, label:string, score:float, weight:int, detail:string}
     */
    private static function scoreSubjects($profile, Collection $requiredSubjectIds): array
    {
        $weight = self::WEIGHTS['subjects'];

        if ($requiredSubjectIds->isEmpty()) {
            return self::factor('subjects', 'Subjects', 1.0, $weight, 'No specific subjects required');
        }

        $tutorSubjectIds = $profile ? $profile->subjects->pluck('id') : collect();
        $matched = $requiredSubjectIds->intersect($tutorSubjectIds);
        $ratio = $matched->count() / $requiredSubjectIds->count();

        return self::factor(
            'subjects',
            'Subjects',
            $ratio,
            $weight,
            "Teaches {$matched->count()} of {$requiredSubjectIds->count()} required subjects",
        );
    }

    /**
     * @return array{key:string, label:string, score:float, weight:int, detail:string}
     */
    private static function scoreLocation($profile, TuitionPost $post): array
    {
        $weight = self::WEIGHTS['location'];

        if (! $post->subdistrict_id) {
            return self::factor('location', 'Location', 1.0, $weight, 'No specific location set');
        }

        $preferred = $profile ? $profile->preferredLocations->pluck('id') : collect();
        $matched = $preferred->contains($post->subdistrict_id);

        return self::factor(
            'location',
            'Location',
            $matched ? 1.0 : 0.0,
            $weight,
            $matched ? 'Teaches in the tuition area' : 'Tuition area not in preferred locations',
        );
    }

    /**
     * @return array{key:string, label:string, score:float, weight:int, detail:string}
     */
    private static function scoreSalary(TuitionApplication $application, TuitionPost $post): array
    {
        $weight = self::WEIGHTS['salary'];
        $expected = $application->expected_salary;

        if ($post->salary_type === 'negotiable' || ! $expected || $expected <= 0) {
            return self::factor('salary', 'Salary fit', 1.0, $weight, 'Negotiable or no expectation given');
        }

        $min = (int) ($post->salary_min ?? 0);
        $max = (int) ($post->salary_max ?? 0);
        $ceiling = $post->salary_type === 'fixed' ? $min : ($max > 0 ? $max : $min);

        if ($ceiling <= 0) {
            return self::factor('salary', 'Salary fit', 1.0, $weight, 'No budget set');
        }

        if ($expected <= $ceiling) {
            return self::factor('salary', 'Salary fit', 1.0, $weight, "Expects BDT {$expected}, within budget");
        }

        // Graded penalty: 50% over budget => 0.
        $overshoot = ($expected - $ceiling) / $ceiling;
        $ratio = max(0.0, 1.0 - ($overshoot / 0.5));

        return self::factor(
            'salary',
            'Salary fit',
            $ratio,
            $weight,
            "Expects BDT {$expected}, above budget of BDT {$ceiling}",
        );
    }

    /**
     * @return array{key:string, label:string, score:float, weight:int, detail:string}
     */
    private static function scoreClassGroupMedium(
        $profile,
        Collection $classLevels,
        Collection $groups,
        Collection $mediums,
    ): array {
        $weight = self::WEIGHTS['class_group_medium'];

        $parts = [];
        $details = [];

        if ($classLevels->isNotEmpty()) {
            $teachable = collect($profile?->teachable_classes ?? [])->map(fn ($v) => (string) $v);
            $ratio = $classLevels->intersect($teachable)->count() / $classLevels->count();
            $parts[] = $ratio;
            $details[] = $ratio >= 1 ? 'all class levels' : 'some class levels';
        }

        if ($groups->isNotEmpty()) {
            $teachable = collect($profile?->teachable_groups ?? []);
            $ratio = $groups->intersect($teachable)->count() / $groups->count();
            $parts[] = $ratio;
            $details[] = $ratio >= 1 ? 'all groups' : 'some groups';
        }

        if ($mediums->isNotEmpty()) {
            $teachable = collect($profile?->teachable_mediums ?? []);
            $ratio = $mediums->intersect($teachable)->count() / $mediums->count();
            $parts[] = $ratio;
            $details[] = $ratio >= 1 ? 'all mediums' : 'some mediums';
        }

        if ($parts === []) {
            return self::factor('class_group_medium', 'Class / group / medium', 1.0, $weight, 'No specific requirement');
        }

        $score = array_sum($parts) / count($parts);

        return self::factor(
            'class_group_medium',
            'Class / group / medium',
            $score,
            $weight,
            'Covers '.implode(', ', $details),
        );
    }

    /**
     * @return array{key:string, label:string, score:float, weight:int, detail:string}
     */
    private static function scoreExperience($profile, TuitionPost $post): array
    {
        $weight = self::WEIGHTS['experience'];
        $required = (int) ($post->required_experience_months ?? 0);
        $tutorMonths = (int) ($profile->experience_months ?? 0);

        if ($required <= 0) {
            // No requirement: reward any experience mildly, full credit at 12+ months.
            $ratio = min(1.0, $tutorMonths / 12);

            return self::factor('experience', 'Experience', $ratio, $weight, "{$tutorMonths} months experience");
        }

        $ratio = min(1.0, $tutorMonths / $required);

        return self::factor(
            'experience',
            'Experience',
            $ratio,
            $weight,
            "{$tutorMonths} of {$required} months required",
        );
    }

    /**
     * @return array{key:string, label:string, score:float, weight:int, detail:string}
     */
    private static function scoreUniversity($profile, Collection $preferredUniversityIds): array
    {
        $weight = self::WEIGHTS['university'];

        if ($preferredUniversityIds->isEmpty()) {
            return self::factor('university', 'University', 1.0, $weight, 'No university preference');
        }

        $matched = $profile && $preferredUniversityIds->contains($profile->university_id);

        return self::factor(
            'university',
            'University',
            $matched ? 1.0 : 0.0,
            $weight,
            $matched ? 'From a preferred university' : 'Not from a preferred university',
        );
    }

    private static function genderMultiplier(TuitionPost $post, TuitionApplication $application): float
    {
        $preference = $post->tutor_gender_preference;

        if (! $preference || $preference === 'any') {
            return 1.0;
        }

        $tutorGender = $application->tutor?->gender;

        if ($tutorGender && $tutorGender !== $preference) {
            return self::GENDER_MISMATCH_MULTIPLIER;
        }

        return 1.0;
    }

    /**
     * @return array{key:string, label:string, score:float, weight:int, detail:string}
     */
    private static function factor(string $key, string $label, float $score, int $weight, string $detail): array
    {
        return [
            'key' => $key,
            'label' => $label,
            'score' => round(max(0.0, min(1.0, $score)), 2),
            'weight' => $weight,
            'detail' => $detail,
        ];
    }
}
