<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('tuition_applications')
            ->where('status', 'contacted')
            ->update(['status' => 'shortlisted']);

        DB::statement("ALTER TABLE tuition_applications MODIFY status ENUM('pending','shortlisted','interested','not_interested','rejected','hired') NOT NULL DEFAULT 'pending'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE tuition_applications MODIFY status ENUM('pending','shortlisted','contacted','interested','not_interested','rejected','hired') NOT NULL DEFAULT 'pending'");
    }
};
