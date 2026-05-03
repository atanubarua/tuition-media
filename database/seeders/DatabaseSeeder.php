<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(LocationSeeder::class);
        $this->call(UniversitySeeder::class);
        $this->call(SubjectSeeder::class);
        $this->call(AdminUserSeeder::class);

        User::factory()->create([
            'name' => 'Test User',
            'phone' => '01700000001',
            'email' => 'test@example.com',
        ]);
    }
}
