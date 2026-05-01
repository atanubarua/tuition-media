<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tuition_posts', function (Blueprint $table) {
            $table->dropColumn('preferred_time_note');
            $table->json('preferred_time_slots')->nullable()->after('days_per_week');
        });
    }

    public function down(): void
    {
        Schema::table('tuition_posts', function (Blueprint $table) {
            $table->dropColumn('preferred_time_slots');
            $table->string('preferred_time_note')->nullable()->after('days_per_week');
        });
    }
};
