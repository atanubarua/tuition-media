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
        Schema::create('tuition_post_students', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tuition_post_id')->constrained('tuition_posts')->cascadeOnDelete();
            $table->string('student_name');
            $table->enum('academic_level', ['primary', 'high_school', 'college', 'honors']);
            $table->unsignedTinyInteger('class_level')->nullable();
            $table->string('honors_subject')->nullable();
            $table->enum('medium', ['bangla', 'english', 'madrasha', 'other'])->default('bangla');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tuition_post_students');
    }
};
