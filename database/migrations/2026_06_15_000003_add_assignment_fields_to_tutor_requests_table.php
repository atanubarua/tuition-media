<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tutor_requests', function (Blueprint $table): void {
            $table->foreignId('tuition_post_id')->nullable()->after('request_group_id')->constrained('tuition_posts')->nullOnDelete();
            $table->foreignId('assigned_tutor_id')->nullable()->after('tuition_post_id')->constrained('users')->nullOnDelete();
            $table->timestamp('contacted_at')->nullable()->after('status');
            $table->timestamp('assigned_at')->nullable()->after('contacted_at');
            $table->timestamp('closed_at')->nullable()->after('assigned_at');
        });
    }

    public function down(): void
    {
        Schema::table('tutor_requests', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('tuition_post_id');
            $table->dropConstrainedForeignId('assigned_tutor_id');
            $table->dropColumn(['contacted_at', 'assigned_at', 'closed_at']);
        });
    }
};
