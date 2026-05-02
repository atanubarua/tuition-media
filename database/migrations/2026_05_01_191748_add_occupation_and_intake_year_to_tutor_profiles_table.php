<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tutor_profiles', function (Blueprint $table) {
            $table->enum('occupation', ['student', 'employed', 'other'])->default('student')->after('user_id');
            $table->string('job_title', 100)->nullable()->after('occupation');
            $table->string('job_organization', 150)->nullable()->after('job_title');
            $table->unsignedSmallInteger('intake_year')->nullable()->after('academic_year');
        });
    }

    public function down(): void
    {
        Schema::table('tutor_profiles', function (Blueprint $table) {
            $table->dropColumn(['occupation', 'job_title', 'job_organization', 'intake_year']);
        });
    }
};
