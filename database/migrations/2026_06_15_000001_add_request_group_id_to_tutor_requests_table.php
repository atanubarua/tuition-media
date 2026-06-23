<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tutor_requests', function (Blueprint $table): void {
            $table->string('request_group_id')->nullable()->after('tutor_id');
            $table->index(['request_group_id', 'created_at'], 'tutor_requests_group_created_at_index');
        });
    }

    public function down(): void
    {
        Schema::table('tutor_requests', function (Blueprint $table): void {
            $table->dropIndex('tutor_requests_group_created_at_index');
            $table->dropColumn('request_group_id');
        });
    }
};
