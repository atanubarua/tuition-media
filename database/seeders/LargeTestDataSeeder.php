<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class LargeTestDataSeeder extends Seeder
{
    private const GUARDIANS = 3000;

    private const TUTORS = 12000;

    private const POSTS = 20000;

    private const APPLICATIONS = 350000;

    private const COMMISSION_PAYMENTS = 80000;

    public function run(): void
    {
        DB::disableQueryLog();

        $now = now();
        $password = Hash::make('password');

        $adminIds = DB::table('users')->where('role', User::ROLE_ADMIN)->pluck('id')->all();
        if (empty($adminIds)) {
            $adminIds = [1];
        }

        $subjectIds = DB::table('subjects')->pluck('id')->all();
        $universityIds = DB::table('universities')->pluck('id')->all();

        $locations = DB::table('subdistricts')
            ->join('districts', 'districts.id', '=', 'subdistricts.district_id')
            ->select('subdistricts.id as subdistrict_id', 'subdistricts.district_id', 'districts.division_id')
            ->get()
            ->map(fn ($row) => [
                'subdistrict_id' => (int) $row->subdistrict_id,
                'district_id' => (int) $row->district_id,
                'division_id' => (int) $row->division_id,
            ])
            ->all();

        if (empty($subjectIds) || empty($universityIds) || empty($locations)) {
            $this->command?->error('LargeTestDataSeeder requires subjects, universities, and locations. Run base seeders first.');

            return;
        }

        $this->command?->info('Creating guardians and tutors...');
        [$guardianIds, $tutorIds] = $this->seedUsers($password, $now);

        $this->command?->info('Creating tutor profiles and preferences...');
        $this->seedTutorProfiles($tutorIds, $subjectIds, $locations, $universityIds, $now);

        $this->command?->info('Creating tuition posts...');
        $postIds = $this->seedTuitionPosts($guardianIds, $locations, $now);

        $this->command?->info('Creating post students and subjects...');
        $this->seedPostStudents($postIds, $subjectIds, $now);

        $this->command?->info('Creating applications and commission records...');
        $hiredAppIdsByType = $this->seedApplications($postIds, $tutorIds, $adminIds, $now);

        $this->command?->info('Creating commission payment history...');
        $this->seedCommissionPayments($hiredAppIdsByType, $adminIds, $now);

        $this->command?->info('LargeTestDataSeeder completed.');
    }

    private function seedUsers(string $password, $now): array
    {
        $maxUserId = (int) DB::table('users')->max('id');

        $rows = [];
        $chunkSize = 1000;

        for ($i = 1; $i <= self::GUARDIANS; $i++) {
            $rows[] = [
                'name' => "Guardian {$i}",
                'phone' => '+88'.sprintf('019%08d', $i),
                'gender' => $i % 2 === 0 ? 'male' : 'female',
                'email' => "guardian{$i}.stress@example.com",
                'role' => User::ROLE_GUARDIAN,
                'email_verified_at' => $now,
                'password' => $password,
                'remember_token' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ];

            if (count($rows) >= $chunkSize) {
                DB::table('users')->insert($rows);
                $rows = [];
            }
        }

        if (! empty($rows)) {
            DB::table('users')->insert($rows);
            $rows = [];
        }

        $guardianIds = range($maxUserId + 1, $maxUserId + self::GUARDIANS);
        $tutorStart = $maxUserId + self::GUARDIANS + 1;

        for ($i = 1; $i <= self::TUTORS; $i++) {
            $rows[] = [
                'name' => "Tutor {$i}",
                'phone' => '+88'.sprintf('018%08d', $i),
                'gender' => $i % 2 === 0 ? 'male' : 'female',
                'email' => "tutor{$i}.stress@example.com",
                'role' => User::ROLE_TUTOR,
                'email_verified_at' => $now,
                'password' => $password,
                'remember_token' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ];

            if (count($rows) >= $chunkSize) {
                DB::table('users')->insert($rows);
                $rows = [];
            }
        }

        if (! empty($rows)) {
            DB::table('users')->insert($rows);
        }

        $tutorIds = range($tutorStart, $tutorStart + self::TUTORS - 1);

        return [$guardianIds, $tutorIds];
    }

    private function seedTutorProfiles(array $tutorIds, array $subjectIds, array $locations, array $universityIds, $now): void
    {
        $profileRows = [];
        $subjectRows = [];
        $locationRows = [];
        $chunkSize = 1000;

        foreach ($tutorIds as $index => $tutorId) {
            $occupation = $index % 10 < 8 ? 'student' : ($index % 2 === 0 ? 'employed' : 'other');
            $expMonths = random_int(0, 72);
            $academicYear = random_int(1, 5);
            $intakeYear = random_int(2016, 2025);

            $profileRows[] = [
                'user_id' => $tutorId,
                'occupation' => $occupation,
                'job_title' => $occupation === 'employed' ? 'Teacher' : null,
                'job_organization' => $occupation === 'employed' ? 'Coaching Center' : null,
                'university_id' => $universityIds[array_rand($universityIds)],
                'department' => 'Department '.random_int(1, 40),
                'academic_year' => $academicYear,
                'intake_year' => $intakeYear,
                'teachable_levels' => json_encode($this->randomSubset(['primary', 'high_school', 'college', 'honors'], random_int(1, 3))),
                'teachable_mediums' => json_encode($this->randomSubset(['bangla', 'english', 'madrasha'], random_int(1, 2))),
                'experience_months' => $expMonths,
                'bio' => 'Experienced tutor available for regular classes.',
                'profile_photo' => null,
                'is_verified' => $index % 7 === 0,
                'created_at' => $now,
                'updated_at' => $now,
            ];

            if (count($profileRows) >= $chunkSize) {
                $this->insertTutorProfileChunk($profileRows, $subjectRows, $locationRows, $subjectIds, $locations, $now);
                $profileRows = [];
                $subjectRows = [];
                $locationRows = [];
            }
        }

        if (! empty($profileRows)) {
            $this->insertTutorProfileChunk($profileRows, $subjectRows, $locationRows, $subjectIds, $locations, $now);
        }
    }

    private function insertTutorProfileChunk(array $profileRows, array &$subjectRows, array &$locationRows, array $subjectIds, array $locations, $now): void
    {
        $profileStart = (int) DB::table('tutor_profiles')->max('id') + 1;
        DB::table('tutor_profiles')->insert($profileRows);
        $profileEnd = $profileStart + count($profileRows) - 1;

        foreach (range($profileStart, $profileEnd) as $profileId) {
            $pickedSubjects = $this->randomSubset($subjectIds, random_int(3, 7));
            foreach ($pickedSubjects as $subjectId) {
                $subjectRows[] = [
                    'tutor_profile_id' => $profileId,
                    'subject_id' => $subjectId,
                ];
            }

            $locationCount = random_int(2, 5);
            $used = [];
            for ($i = 0; $i < $locationCount; $i++) {
                $loc = $locations[array_rand($locations)];
                if (isset($used[$loc['subdistrict_id']])) {
                    continue;
                }
                $used[$loc['subdistrict_id']] = true;
                $locationRows[] = [
                    'tutor_profile_id' => $profileId,
                    'subdistrict_id' => $loc['subdistrict_id'],
                ];
            }
        }

        if (! empty($subjectRows)) {
            DB::table('tutor_subjects')->insert($subjectRows);
        }

        if (! empty($locationRows)) {
            DB::table('tutor_preferred_locations')->insert($locationRows);
        }
    }

    private function seedTuitionPosts(array $guardianIds, array $locations, $now): array
    {
        $maxPostId = (int) DB::table('tuition_posts')->max('id');
        $rows = [];
        $chunkSize = 1000;

        for ($i = 1; $i <= self::POSTS; $i++) {
            $loc = $locations[array_rand($locations)];
            $salaryType = $i % 3 === 0 ? 'range' : 'fixed';
            $salaryMin = random_int(5000, 18000);
            $salaryMax = $salaryType === 'range' ? $salaryMin + random_int(1000, 6000) : null;
            $status = $i % 20 === 0 ? 'completed' : ($i % 13 === 0 ? 'assigned' : 'published');
            $publishedAt = $status === 'published' || $status === 'assigned' || $status === 'completed' ? $now->copy()->subDays(random_int(1, 120)) : null;

            $rows[] = [
                'tuition_code' => sprintf('TIDSTR%08d', $i),
                'guardian_id' => $guardianIds[array_rand($guardianIds)],
                'title' => 'Need Home Tutor #'.$i,
                'division_id' => $loc['division_id'],
                'district_id' => $loc['district_id'],
                'subdistrict_id' => $loc['subdistrict_id'],
                'address_line' => 'Road '.random_int(1, 140).', House '.random_int(1, 300),
                'salary_type' => $salaryType,
                'salary_min' => $salaryMin,
                'salary_max' => $salaryMax,
                'days_per_week' => random_int(3, 6),
                'preferred_time_slots' => json_encode($this->randomSubset(['6am-7am', '7am-8am', '8am-9am', '9am-10am', '10am-11am', '11am-12pm', '12pm-1pm', '1pm-2pm', '2pm-3pm', '3pm-4pm', '4pm-5pm', '5pm-6pm', '6pm-7pm', '7pm-8pm', '8pm-9pm', '9pm-10pm'], random_int(1, 3))),
                'duration_months' => random_int(3, 12),
                'tutor_gender_preference' => ['male', 'female', 'any'][array_rand(['male', 'female', 'any'])],
                'required_experience_months' => random_int(0, 24),
                'special_requirements' => $i % 4 === 0 ? 'Strong communication skill preferred.' : null,
                'status' => $status,
                'published_at' => $publishedAt,
                'created_at' => $now,
                'updated_at' => $now,
            ];

            if (count($rows) >= $chunkSize) {
                DB::table('tuition_posts')->insert($rows);
                $rows = [];
            }
        }

        if (! empty($rows)) {
            DB::table('tuition_posts')->insert($rows);
        }

        return range($maxPostId + 1, $maxPostId + self::POSTS);
    }

    private function seedPostStudents(array $postIds, array $subjectIds, $now): void
    {
        $studentRows = [];
        $pivotRows = [];
        $chunkSize = 2000;

        foreach ($postIds as $postId) {
            $studentCount = random_int(1, 2);
            for ($s = 1; $s <= $studentCount; $s++) {
                $level = ['primary', 'high_school', 'college', 'honors'][array_rand(['primary', 'high_school', 'college', 'honors'])];
                $classLevel = $level === 'honors' ? null : (string) random_int(1, 12);

                $studentRows[] = [
                    'tuition_post_id' => $postId,
                    'student_name' => 'Student '.random_int(1000, 999999),
                    'academic_level' => $level,
                    'class_level' => $classLevel,
                    'academic_group' => $classLevel !== null && in_array($classLevel, ['9', '10', '11', '12'], true)
                        ? ['science', 'commerce', 'arts'][array_rand(['science', 'commerce', 'arts'])]
                        : null,
                    'honors_subject' => $level === 'honors' ? 'Subject '.random_int(1, 10) : null,
                    'medium' => ['bangla', 'english', 'madrasha'][array_rand(['bangla', 'english', 'madrasha'])],
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            if (count($studentRows) >= $chunkSize) {
                $this->insertStudentsChunk($studentRows, $pivotRows, $subjectIds);
                $studentRows = [];
                $pivotRows = [];
            }
        }

        if (! empty($studentRows)) {
            $this->insertStudentsChunk($studentRows, $pivotRows, $subjectIds);
        }
    }

    private function insertStudentsChunk(array $studentRows, array &$pivotRows, array $subjectIds): void
    {
        $studentStart = (int) DB::table('tuition_post_students')->max('id') + 1;
        DB::table('tuition_post_students')->insert($studentRows);
        $studentEnd = $studentStart + count($studentRows) - 1;

        foreach (range($studentStart, $studentEnd) as $studentId) {
            $picked = $this->randomSubset($subjectIds, random_int(2, 4));
            foreach ($picked as $subjectId) {
                $pivotRows[] = [
                    'tuition_post_student_id' => $studentId,
                    'subject_id' => $subjectId,
                ];
            }
        }

        if (! empty($pivotRows)) {
            DB::table('tuition_post_student_subject')->insert($pivotRows);
        }
    }

    private function seedApplications(array $postIds, array $tutorIds, array $adminIds, $now): array
    {
        $applicationRows = [];
        // MySQL prepared statements have a placeholder limit; keep rows well below it.
        $chunkSize = 2500;
        $maxApplicationId = (int) DB::table('tuition_applications')->max('id');
        $nextApplicationId = $maxApplicationId + 1;

        $hiredPaidAmounts = [];
        $hiredPartialAmounts = [];
        $hiredUnpaidIds = [];

        $hiredPaidTarget = 30000;
        $hiredPartialTarget = 20000;
        $hiredUnpaidTarget = 20000;

        $fullRounds = intdiv(self::APPLICATIONS, count($postIds));
        $extra = self::APPLICATIONS % count($postIds);

        foreach ($postIds as $idx => $postId) {
            $applicationsForPost = $fullRounds + ($idx < $extra ? 1 : 0);
            $pickedTutorIds = $this->pickUniqueIds($tutorIds, $applicationsForPost);
            $postHasHired = false;

            foreach ($pickedTutorIds as $tutorId) {
                $status = 'pending';
                $commissionType = null;
                $commissionValue = null;
                $commissionAmount = null;
                $commissionReceivedAmount = 0;
                $commissionPaymentStatus = 'unpaid';
                $commissionPaidAt = null;
                $commissionDueDate = null;
                $hiredBy = null;
                $hiredAt = null;

                if (! $postHasHired && count($hiredPaidAmounts) < $hiredPaidTarget) {
                    $status = 'hired';
                    $commissionType = 'fixed';
                    $commissionAmount = random_int(3000, 12000);
                    $commissionValue = (string) $commissionAmount;
                    $commissionReceivedAmount = $commissionAmount;
                    $commissionPaymentStatus = 'paid';
                    $commissionPaidAt = $now->copy()->subDays(random_int(1, 90));
                    $commissionDueDate = null;
                    $hiredBy = $adminIds[array_rand($adminIds)];
                    $hiredAt = $now->copy()->subDays(random_int(5, 120));
                    $hiredPaidAmounts[$nextApplicationId] = $commissionAmount;
                    $postHasHired = true;
                } elseif (! $postHasHired && count($hiredPartialAmounts) < $hiredPartialTarget) {
                    $status = 'hired';
                    $commissionType = 'fixed';
                    $commissionAmount = random_int(4000, 15000);
                    $commissionValue = (string) $commissionAmount;
                    $commissionReceivedAmount = random_int(1000, max(1000, $commissionAmount - 500));
                    $commissionPaymentStatus = 'partial';
                    $commissionDueDate = $now->copy()->addDays(random_int(3, 45))->toDateString();
                    $hiredBy = $adminIds[array_rand($adminIds)];
                    $hiredAt = $now->copy()->subDays(random_int(5, 120));
                    $hiredPartialAmounts[$nextApplicationId] = ['total' => $commissionAmount, 'received' => $commissionReceivedAmount];
                    $postHasHired = true;
                } elseif (! $postHasHired && count($hiredUnpaidIds) < $hiredUnpaidTarget) {
                    $status = 'hired';
                    $commissionType = 'fixed';
                    $commissionAmount = random_int(4000, 15000);
                    $commissionValue = (string) $commissionAmount;
                    $commissionReceivedAmount = 0;
                    $commissionPaymentStatus = 'unpaid';
                    $commissionDueDate = $now->copy()->addDays(random_int(7, 60))->toDateString();
                    $hiredBy = $adminIds[array_rand($adminIds)];
                    $hiredAt = $now->copy()->subDays(random_int(5, 120));
                    $hiredUnpaidIds[] = $nextApplicationId;
                    $postHasHired = true;
                } else {
                    $status = $this->randomStatus();
                }

                $applicationRows[] = [
                    'tuition_post_id' => $postId,
                    'tutor_id' => $tutorId,
                    'cover_note' => 'I can teach consistently and follow your schedule.',
                    'expected_salary' => random_int(6000, 22000),
                    'status' => $status,
                    'admin_note' => $status === 'pending' ? null : 'Reviewed by admin team.',
                    'hired_by' => $hiredBy,
                    'hired_at' => $hiredAt,
                    'commission_type' => $commissionType,
                    'commission_value' => $commissionValue,
                    'commission_amount' => $commissionAmount,
                    'commission_received_amount' => $commissionReceivedAmount,
                    'commission_payment_status' => $commissionPaymentStatus,
                    'commission_paid_at' => $commissionPaidAt,
                    'commission_due_date' => $commissionDueDate,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                $nextApplicationId++;

                if (count($applicationRows) >= $chunkSize) {
                    DB::table('tuition_applications')->insert($applicationRows);
                    $applicationRows = [];
                }
            }
        }

        if (! empty($applicationRows)) {
            DB::table('tuition_applications')->insert($applicationRows);
        }

        return [
            'paid_amounts' => $hiredPaidAmounts,
            'partial_amounts' => $hiredPartialAmounts,
        ];
    }

    private function seedCommissionPayments(array $hiredAppIdsByType, array $adminIds, $now): void
    {
        $rows = [];
        $chunkSize = 2500;

        foreach ($hiredAppIdsByType['paid_amounts'] as $applicationId => $amount) {
            $rows[] = [
                'tuition_application_id' => $applicationId,
                'amount' => $amount,
                'received_by' => $adminIds[array_rand($adminIds)],
                'note' => 'Full payment received at first attempt.',
                'received_at' => $now->copy()->subDays(random_int(1, 90)),
                'due_on' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ];

            if (count($rows) >= $chunkSize) {
                DB::table('commission_payments')->insert($rows);
                $rows = [];
            }
        }

        $partialIds = array_keys($hiredAppIdsByType['partial_amounts']);
        foreach ($partialIds as $idx => $applicationId) {
            $received = (int) $hiredAppIdsByType['partial_amounts'][$applicationId]['received'];
            $parts = $idx < 10000 ? 2 : 3;
            $remaining = $received;

            for ($p = 1; $p <= $parts; $p++) {
                $amount = $p === $parts ? $remaining : random_int(500, max(500, (int) floor($remaining / 2)));
                $remaining -= $amount;

                if ($amount <= 0) {
                    break;
                }

                $rows[] = [
                    'tuition_application_id' => $applicationId,
                    'amount' => $amount,
                    'received_by' => $adminIds[array_rand($adminIds)],
                    'note' => 'Installment payment #'.$p,
                    'received_at' => $now->copy()->subDays(random_int(1, 80)),
                    'due_on' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                if (count($rows) >= $chunkSize) {
                    DB::table('commission_payments')->insert($rows);
                    $rows = [];
                }
            }
        }

        if (! empty($rows)) {
            DB::table('commission_payments')->insert($rows);
        }

        // Keep exact requested size if distribution logic ever changes.
        $currentCount = (int) DB::table('commission_payments')->count();
        if ($currentCount > self::COMMISSION_PAYMENTS) {
            $toDelete = $currentCount - self::COMMISSION_PAYMENTS;
            $ids = DB::table('commission_payments')->orderByDesc('id')->limit($toDelete)->pluck('id')->all();
            if (! empty($ids)) {
                DB::table('commission_payments')->whereIn('id', $ids)->delete();
            }
        }
    }

    private function randomSubset(array $source, int $count): array
    {
        if ($count >= count($source)) {
            return $source;
        }

        $keys = array_rand($source, $count);
        if (! is_array($keys)) {
            return [$source[$keys]];
        }

        $picked = [];
        foreach ($keys as $key) {
            $picked[] = $source[$key];
        }

        return $picked;
    }

    private function pickUniqueIds(array $pool, int $count): array
    {
        $picked = [];
        $seen = [];

        while (count($picked) < $count) {
            $id = $pool[array_rand($pool)];
            if (isset($seen[$id])) {
                continue;
            }
            $seen[$id] = true;
            $picked[] = $id;
        }

        return $picked;
    }

    private function randomStatus(): string
    {
        $roll = random_int(1, 100);

        return match (true) {
            $roll <= 45 => 'pending',
            $roll <= 70 => 'shortlisted',
            $roll <= 82 => 'interested',
            $roll <= 90 => 'not_interested',
            default => 'rejected',
        };
    }
}
