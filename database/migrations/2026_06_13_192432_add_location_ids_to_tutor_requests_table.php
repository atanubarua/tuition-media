<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tutor_requests', function (Blueprint $table) {
            $table->unsignedBigInteger('division_id')->nullable()->after('tutor_id');
            $table->unsignedBigInteger('district_id')->nullable()->after('division_id');
            $table->unsignedBigInteger('subdistrict_id')->nullable()->after('district_id');
            $table->dropColumn(['location', 'subject']);
        });
    }

    public function down(): void
    {
        Schema::table('tutor_requests', function (Blueprint $table) {
            $table->dropColumn(['division_id', 'district_id', 'subdistrict_id']);
            $table->string('location')->nullable();
            $table->string('subject')->nullable();
        });
    }
};
