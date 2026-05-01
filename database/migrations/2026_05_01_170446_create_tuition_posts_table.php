<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tuition_posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('guardian_id')->constrained('users')->cascadeOnDelete();
            $table->string('title')->nullable();
            $table->foreignId('division_id')->constrained('divisions');
            $table->foreignId('district_id')->constrained('districts');
            $table->foreignId('subdistrict_id')->constrained('subdistricts');
            $table->string('address_line')->nullable();
            $table->enum('salary_type', ['fixed', 'range'])->default('fixed');
            $table->unsignedInteger('salary_min')->nullable();
            $table->unsignedInteger('salary_max')->nullable();
            $table->unsignedTinyInteger('days_per_week');
            $table->string('preferred_time_note')->nullable();
            $table->unsignedTinyInteger('duration_months')->nullable();
            $table->enum('tutor_gender_preference', ['male', 'female', 'any'])->default('any');
            $table->unsignedSmallInteger('required_experience_months')->nullable();
            $table->text('special_requirements')->nullable();
            $table->enum('status', ['draft', 'published', 'shortlisted', 'assigned', 'completed', 'closed', 'cancelled'])->default('draft');
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tuition_posts');
    }
};
