<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('tuition_applications', 'admin_contact_status')) {
            DB::table('tuition_applications')
                ->where('status', 'shortlisted')
                ->where('admin_contact_status', 'contacted')
                ->update(['status' => 'contacted']);

            DB::table('tuition_applications')
                ->where('status', 'shortlisted')
                ->where('admin_contact_status', 'interested')
                ->update(['status' => 'interested']);

            DB::table('tuition_applications')
                ->where('status', 'shortlisted')
                ->where('admin_contact_status', 'not_interested')
                ->update(['status' => 'not_interested']);
        }

        DB::statement("ALTER TABLE tuition_applications MODIFY status ENUM('pending','shortlisted','contacted','interested','not_interested','rejected','hired') NOT NULL DEFAULT 'pending'");

        if (Schema::hasColumn('tuition_applications', 'admin_contact_status')) {
            Schema::table('tuition_applications', function (Blueprint $table): void {
                $table->dropColumn('admin_contact_status');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasColumn('tuition_applications', 'admin_contact_status')) {
            Schema::table('tuition_applications', function (Blueprint $table): void {
                $table->enum('admin_contact_status', ['new', 'contacted', 'interested', 'not_interested'])
                    ->default('new')
                    ->after('status');
            });
        }

        DB::table('tuition_applications')->where('status', 'contacted')->update([
            'status' => 'shortlisted',
            'admin_contact_status' => 'contacted',
        ]);

        DB::table('tuition_applications')->where('status', 'interested')->update([
            'status' => 'shortlisted',
            'admin_contact_status' => 'interested',
        ]);

        DB::table('tuition_applications')->where('status', 'not_interested')->update([
            'status' => 'shortlisted',
            'admin_contact_status' => 'not_interested',
        ]);

        DB::statement("ALTER TABLE tuition_applications MODIFY status ENUM('pending','shortlisted','rejected','hired') NOT NULL DEFAULT 'pending'");
    }
};
