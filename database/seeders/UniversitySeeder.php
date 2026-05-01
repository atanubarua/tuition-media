<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class UniversitySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $universities = [
            ['name' => 'University of Dhaka', 'type' => 'public', 'city' => 'Dhaka'],
            ['name' => 'University of Rajshahi', 'type' => 'public', 'city' => 'Rajshahi'],
            ['name' => 'University of Chittagong', 'type' => 'public', 'city' => 'Chattogram'],
            ['name' => 'Jahangirnagar University', 'type' => 'public', 'city' => 'Savar'],
            ['name' => 'Bangladesh Agricultural University', 'type' => 'public', 'city' => 'Mymensingh'],
            ['name' => 'Bangladesh University of Engineering and Technology', 'type' => 'public', 'city' => 'Dhaka'],
            ['name' => 'Khulna University', 'type' => 'public', 'city' => 'Khulna'],
            ['name' => 'Shahjalal University of Science and Technology', 'type' => 'public', 'city' => 'Sylhet'],
            ['name' => 'Islamic University, Bangladesh', 'type' => 'public', 'city' => 'Kushtia'],
            ['name' => 'National University, Bangladesh', 'type' => 'national', 'city' => 'Gazipur'],
            ['name' => 'Bangladesh Open University', 'type' => 'public', 'city' => 'Gazipur'],
            ['name' => 'Bangabandhu Sheikh Mujib Medical University', 'type' => 'public', 'city' => 'Dhaka'],
            ['name' => 'Hajee Mohammad Danesh Science and Technology University', 'type' => 'public', 'city' => 'Dinajpur'],
            ['name' => 'Mawlana Bhashani Science and Technology University', 'type' => 'public', 'city' => 'Tangail'],
            ['name' => 'Noakhali Science and Technology University', 'type' => 'public', 'city' => 'Noakhali'],
            ['name' => 'Jagannath University', 'type' => 'public', 'city' => 'Dhaka'],
            ['name' => 'Comilla University', 'type' => 'public', 'city' => 'Cumilla'],
            ['name' => 'Jatiya Kabi Kazi Nazrul Islam University', 'type' => 'public', 'city' => 'Mymensingh'],
            ['name' => 'Chittagong University of Engineering and Technology', 'type' => 'public', 'city' => 'Chattogram'],
            ['name' => 'Rajshahi University of Engineering and Technology', 'type' => 'public', 'city' => 'Rajshahi'],
            ['name' => 'Khulna University of Engineering and Technology', 'type' => 'public', 'city' => 'Khulna'],
            ['name' => 'Patuakhali Science and Technology University', 'type' => 'public', 'city' => 'Patuakhali'],
            ['name' => 'Pabna University of Science and Technology', 'type' => 'public', 'city' => 'Pabna'],
            ['name' => 'Begum Rokeya University, Rangpur', 'type' => 'public', 'city' => 'Rangpur'],
            ['name' => 'Jessore University of Science and Technology', 'type' => 'public', 'city' => 'Jashore'],
            ['name' => 'Bangladesh University of Professionals', 'type' => 'public', 'city' => 'Dhaka'],
            ['name' => 'Bangabandhu Sheikh Mujibur Rahman Agricultural University', 'type' => 'public', 'city' => 'Gazipur'],
            ['name' => 'Sylhet Agricultural University', 'type' => 'public', 'city' => 'Sylhet'],
            ['name' => 'Sher-e-Bangla Agricultural University', 'type' => 'public', 'city' => 'Dhaka'],
            ['name' => 'Bangabandhu Sheikh Mujibur Rahman Maritime University', 'type' => 'public', 'city' => 'Dhaka'],
            ['name' => 'Rangamati Science and Technology University', 'type' => 'public', 'city' => 'Rangamati'],
            ['name' => 'Rabindra University, Bangladesh', 'type' => 'public', 'city' => 'Sirajganj'],
            ['name' => 'Sheikh Hasina University', 'type' => 'public', 'city' => 'Netrokona'],
            ['name' => 'Bangamata Sheikh Fojilatunnesa Mujib Science and Technology University', 'type' => 'public', 'city' => 'Jamalpur'],
            ['name' => 'North South University', 'type' => 'private', 'city' => 'Dhaka'],
            ['name' => 'Independent University, Bangladesh', 'type' => 'private', 'city' => 'Dhaka'],
            ['name' => 'BRAC University', 'type' => 'private', 'city' => 'Dhaka'],
            ['name' => 'American International University-Bangladesh', 'type' => 'private', 'city' => 'Dhaka'],
            ['name' => 'East West University', 'type' => 'private', 'city' => 'Dhaka'],
            ['name' => 'University of Asia Pacific', 'type' => 'private', 'city' => 'Dhaka'],
            ['name' => 'Ahsanullah University of Science and Technology', 'type' => 'private', 'city' => 'Dhaka'],
            ['name' => 'United International University', 'type' => 'private', 'city' => 'Dhaka'],
            ['name' => 'Daffodil International University', 'type' => 'private', 'city' => 'Dhaka'],
            ['name' => 'Southeast University', 'type' => 'private', 'city' => 'Dhaka'],
            ['name' => 'Dhaka International University', 'type' => 'private', 'city' => 'Dhaka'],
            ['name' => 'University of Information Technology and Sciences', 'type' => 'private', 'city' => 'Dhaka'],
            ['name' => 'Stamford University Bangladesh', 'type' => 'private', 'city' => 'Dhaka'],
            ['name' => 'State University of Bangladesh', 'type' => 'private', 'city' => 'Dhaka'],
            ['name' => 'City University, Bangladesh', 'type' => 'private', 'city' => 'Dhaka'],
            ['name' => 'Green University of Bangladesh', 'type' => 'private', 'city' => 'Dhaka'],
            ['name' => 'University of Development Alternative', 'type' => 'private', 'city' => 'Dhaka'],
            ['name' => 'The People\'s University of Bangladesh', 'type' => 'private', 'city' => 'Dhaka'],
            ['name' => 'Prime University', 'type' => 'private', 'city' => 'Dhaka'],
            ['name' => 'Premier University', 'type' => 'private', 'city' => 'Chattogram'],
            ['name' => 'International Islamic University Chittagong', 'type' => 'private', 'city' => 'Chattogram'],
            ['name' => 'University of Science and Technology Chittagong', 'type' => 'private', 'city' => 'Chattogram'],
            ['name' => 'BGC Trust University Bangladesh', 'type' => 'private', 'city' => 'Chattogram'],
            ['name' => 'East Delta University', 'type' => 'private', 'city' => 'Chattogram'],
            ['name' => 'Leading University', 'type' => 'private', 'city' => 'Sylhet'],
            ['name' => 'Metropolitan University', 'type' => 'private', 'city' => 'Sylhet'],
            ['name' => 'Sylhet International University', 'type' => 'private', 'city' => 'Sylhet'],
            ['name' => 'Varendra University', 'type' => 'private', 'city' => 'Rajshahi'],
            ['name' => 'Uttara University', 'type' => 'private', 'city' => 'Dhaka'],
            ['name' => 'Northern University Bangladesh', 'type' => 'private', 'city' => 'Dhaka'],
            ['name' => 'ASA University Bangladesh', 'type' => 'private', 'city' => 'Dhaka'],
        ];

        $now = now();

        $payload = array_map(function (array $university) use ($now): array {
            return [
                ...$university,
                'slug' => Str::slug($university['name']),
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }, $universities);

        DB::table('universities')->upsert(
            $payload,
            ['name'],
            ['slug', 'type', 'city', 'is_active', 'updated_at']
        );
    }
}
