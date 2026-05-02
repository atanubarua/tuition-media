<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tuition_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tuition_post_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tutor_id')->constrained('users')->cascadeOnDelete();
            $table->text('cover_note')->nullable();
            $table->unsignedInteger('expected_salary')->nullable();
            $table->enum('status', ['pending', 'shortlisted', 'rejected', 'hired'])->default('pending');
            $table->timestamps();

            $table->unique(['tuition_post_id', 'tutor_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tuition_applications');
    }
};
