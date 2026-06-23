<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tutor_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('guardian_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('tutor_id')->constrained('users')->cascadeOnDelete();
            $table->string('class_level')->nullable();
            $table->string('academic_group')->nullable();
            $table->string('subject')->nullable();
            $table->string('location')->nullable();
            $table->text('message')->nullable();
            $table->enum('status', ['pending', 'reviewed', 'approved', 'rejected', 'archived'])->default('pending');
            $table->text('admin_note')->nullable();
            $table->timestamps();

            $table->index(['status', 'created_at']);
            $table->index(['guardian_id', 'created_at']);
            $table->index(['tutor_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tutor_requests');
    }
};
