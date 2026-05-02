<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tuition_post_students', function (Blueprint $table) {
            $table->string('class_level', 20)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('tuition_post_students', function (Blueprint $table) {
            $table->unsignedTinyInteger('class_level')->nullable()->change();
        });
    }
};
