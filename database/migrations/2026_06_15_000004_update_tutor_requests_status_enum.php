<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE tutor_requests MODIFY status ENUM('pending', 'contacted', 'approved', 'rejected', 'assigned', 'archived') NOT NULL DEFAULT 'pending'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE tutor_requests MODIFY status ENUM('pending', 'reviewed', 'approved', 'rejected', 'archived') NOT NULL DEFAULT 'pending'");
    }
};
