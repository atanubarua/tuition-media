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
        Schema::create('subdistricts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('district_id')->constrained('districts')->cascadeOnDelete();
            $table->string('name');
            $table->string('slug');
            $table->enum('type', ['upazila', 'thana'])->default('upazila');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['district_id', 'name', 'type']);
            $table->unique(['district_id', 'slug', 'type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subdistricts');
    }
};
