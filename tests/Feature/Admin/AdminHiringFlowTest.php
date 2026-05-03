<?php

use App\Models\TuitionApplication;
use App\Models\TuitionPost;
use App\Models\User;
use Illuminate\Support\Facades\DB;

function seedLocationForTuitionPost(): void
{
    $now = now();

    DB::table('divisions')->insert([
        'id' => 1,
        'name' => 'Dhaka',
        'slug' => 'dhaka',
        'is_active' => true,
        'created_at' => $now,
        'updated_at' => $now,
    ]);
    DB::table('districts')->insert([
        'id' => 1,
        'division_id' => 1,
        'name' => 'Dhaka',
        'slug' => 'dhaka',
        'is_active' => true,
        'created_at' => $now,
        'updated_at' => $now,
    ]);
    DB::table('subdistricts')->insert([
        'id' => 1,
        'district_id' => 1,
        'name' => 'Dhanmondi',
        'slug' => 'dhanmondi',
        'type' => 'thana',
        'is_active' => true,
        'created_at' => $now,
        'updated_at' => $now,
    ]);
}

test('admin can hire a shortlisted and interested application', function () {
    seedLocationForTuitionPost();

    $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
    $guardian = User::factory()->create(['role' => User::ROLE_GUARDIAN]);
    $tutor = User::factory()->create(['role' => User::ROLE_TUTOR]);

    $post = TuitionPost::create([
        'guardian_id' => $guardian->id,
        'title' => 'Physics Tutor Needed',
        'division_id' => 1,
        'district_id' => 1,
        'subdistrict_id' => 1,
        'salary_type' => 'fixed',
        'salary_min' => 5000,
        'salary_max' => null,
        'days_per_week' => 3,
        'tutor_gender_preference' => 'any',
        'status' => 'published',
    ]);

    $application = TuitionApplication::create([
        'tuition_post_id' => $post->id,
        'tutor_id' => $tutor->id,
        'status' => 'shortlisted',
        'admin_contact_status' => 'interested',
    ]);

    $response = $this->actingAs($admin)
        ->patch(route('admin.applications.hire', $application), [
            'commission_type' => 'fixed',
            'commission_value' => 2000,
        ]);

    $response->assertRedirect();
    $application->refresh();
    $post->refresh();

    expect($application->status)->toBe('hired')
        ->and($application->hired_by)->toBe($admin->id)
        ->and($application->hired_at)->not->toBeNull()
        ->and($post->status)->toBe('assigned');
});

test('admin cannot hire unless application is shortlisted and interested', function () {
    seedLocationForTuitionPost();

    $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
    $guardian = User::factory()->create(['role' => User::ROLE_GUARDIAN]);
    $tutor = User::factory()->create(['role' => User::ROLE_TUTOR]);

    $post = TuitionPost::create([
        'guardian_id' => $guardian->id,
        'title' => 'Math Tutor Needed',
        'division_id' => 1,
        'district_id' => 1,
        'subdistrict_id' => 1,
        'salary_type' => 'fixed',
        'salary_min' => 4000,
        'salary_max' => null,
        'days_per_week' => 2,
        'tutor_gender_preference' => 'any',
        'status' => 'published',
    ]);

    $application = TuitionApplication::create([
        'tuition_post_id' => $post->id,
        'tutor_id' => $tutor->id,
        'status' => 'shortlisted',
        'admin_contact_status' => 'contacted',
    ]);

    $response = $this->actingAs($admin)
        ->patch(route('admin.applications.hire', $application));

    $response->assertRedirect();
    $application->refresh();
    expect($application->status)->toBe('shortlisted');
});

test('guardian cannot access admin hire endpoint', function () {
    seedLocationForTuitionPost();

    $guardian = User::factory()->create(['role' => User::ROLE_GUARDIAN]);
    $tutor = User::factory()->create(['role' => User::ROLE_TUTOR]);

    $post = TuitionPost::create([
        'guardian_id' => $guardian->id,
        'title' => 'English Tutor Needed',
        'division_id' => 1,
        'district_id' => 1,
        'subdistrict_id' => 1,
        'salary_type' => 'fixed',
        'salary_min' => 3500,
        'salary_max' => null,
        'days_per_week' => 2,
        'tutor_gender_preference' => 'any',
        'status' => 'published',
    ]);

    $application = TuitionApplication::create([
        'tuition_post_id' => $post->id,
        'tutor_id' => $tutor->id,
        'status' => 'shortlisted',
        'admin_contact_status' => 'interested',
    ]);

    $this->actingAs($guardian)
        ->patch(route('admin.applications.hire', $application))
        ->assertForbidden();
});
