<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SubjectSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $subjects = [
            ['name' => 'Bangla', 'group_name' => 'school'],
            ['name' => 'English', 'group_name' => 'school'],
            ['name' => 'General Math', 'group_name' => 'school'],
            ['name' => 'Higher Math', 'group_name' => 'school'],
            ['name' => 'General Science', 'group_name' => 'school'],
            ['name' => 'Physics', 'group_name' => 'school_college'],
            ['name' => 'Chemistry', 'group_name' => 'school_college'],
            ['name' => 'Biology', 'group_name' => 'school_college'],
            ['name' => 'ICT', 'group_name' => 'school_college'],
            ['name' => 'Religion', 'group_name' => 'school'],
            ['name' => 'Bangladesh and Global Studies', 'group_name' => 'school'],
            ['name' => 'BGS', 'group_name' => 'school'],
            ['name' => 'History', 'group_name' => 'school_college'],
            ['name' => 'Geography', 'group_name' => 'school_college'],
            ['name' => 'Civics', 'group_name' => 'school_college'],
            ['name' => 'Economics', 'group_name' => 'school_college'],
            ['name' => 'Accounting', 'group_name' => 'school_college'],
            ['name' => 'Finance', 'group_name' => 'school_college'],
            ['name' => 'Business Entrepreneurship', 'group_name' => 'school_college'],
            ['name' => 'Agriculture', 'group_name' => 'school'],
            ['name' => 'Home Science', 'group_name' => 'school'],
            ['name' => 'Arabic', 'group_name' => 'school'],
            ['name' => 'Islamic Studies', 'group_name' => 'school_college'],
            ['name' => 'Sociology', 'group_name' => 'school_college'],
            ['name' => 'Statistics', 'group_name' => 'school_college'],
            ['name' => 'Philosophy', 'group_name' => 'college_honors'],
            ['name' => 'Logic', 'group_name' => 'college_honors'],
            ['name' => 'CSE', 'group_name' => 'honors'],
            ['name' => 'EEE', 'group_name' => 'honors'],
            ['name' => 'BBA', 'group_name' => 'honors'],
            ['name' => 'Law', 'group_name' => 'honors'],
            ['name' => 'Mathematics', 'group_name' => 'honors'],
            ['name' => 'English Literature', 'group_name' => 'honors'],
            ['name' => 'Political Science', 'group_name' => 'honors'],
            ['name' => 'Public Administration', 'group_name' => 'honors'],
        ];

        $now = now();

        $rows = array_map(function (array $subject) use ($now): array {
            return [
                ...$subject,
                'slug' => Str::slug($subject['name']),
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }, $subjects);

        DB::table('subjects')->upsert(
            $rows,
            ['name'],
            ['slug', 'group_name', 'is_active', 'updated_at']
        );
    }
}
