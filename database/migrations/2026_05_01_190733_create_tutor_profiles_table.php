<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tutor_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->foreignId('university_id')->nullable()->constrained('universities')->nullOnDelete();
            $table->string('department', 100)->nullable();
            $table->tinyInteger('academic_year')->unsigned()->nullable()->comment('1-4 = year, 5 = passed');
            $table->json('teachable_levels')->nullable();
            $table->json('teachable_mediums')->nullable();
            $table->smallInteger('experience_months')->unsigned()->default(0);
            $table->text('bio')->nullable();
            $table->string('profile_photo')->nullable();
            $table->boolean('is_verified')->default(false);
            $table->timestamps();
        });

        Schema::create('tutor_subjects', function (Blueprint $table) {
            $table->foreignId('tutor_profile_id')->constrained('tutor_profiles')->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained('subjects')->cascadeOnDelete();
            $table->primary(['tutor_profile_id', 'subject_id']);
        });

        Schema::create('tutor_preferred_locations', function (Blueprint $table) {
            $table->foreignId('tutor_profile_id')->constrained('tutor_profiles')->cascadeOnDelete();
            $table->foreignId('subdistrict_id')->constrained('subdistricts')->cascadeOnDelete();
            $table->primary(['tutor_profile_id', 'subdistrict_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tutor_preferred_locations');
        Schema::dropIfExists('tutor_subjects');
        Schema::dropIfExists('tutor_profiles');
    }
};
