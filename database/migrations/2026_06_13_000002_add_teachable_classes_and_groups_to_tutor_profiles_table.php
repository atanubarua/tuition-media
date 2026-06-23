<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tutor_profiles', function (Blueprint $table): void {
            $table->json('teachable_classes')->nullable()->after('teachable_levels');
            $table->json('teachable_groups')->nullable()->after('teachable_classes');
        });
    }

    public function down(): void
    {
        Schema::table('tutor_profiles', function (Blueprint $table): void {
            $table->dropColumn(['teachable_classes', 'teachable_groups']);
        });
    }
};
