<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $email    = config('admin.email');
        $password = config('admin.password');

        if (! $email || ! $password) {
            $this->command->warn('ADMIN_EMAIL or ADMIN_PASSWORD not set. Skipping.');
            return;
        }

        User::updateOrCreate(
            ['email' => $email],
            [
                'name'     => config('admin.name'),
                'phone'    => config('admin.phone'),
                'role'     => User::ROLE_ADMIN,
                'gender'   => null,
                'password' => $password,
            ],
        );
    }
}
