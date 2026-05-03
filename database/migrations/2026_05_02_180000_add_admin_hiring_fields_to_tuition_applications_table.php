<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tuition_applications', function (Blueprint $table) {
            $table->enum('admin_contact_status', ['new', 'contacted', 'interested', 'not_interested'])
                ->default('new')
                ->after('status');
            $table->text('admin_note')->nullable()->after('admin_contact_status');
            $table->foreignId('hired_by')->nullable()->after('admin_note')->constrained('users')->nullOnDelete();
            $table->timestamp('hired_at')->nullable()->after('hired_by');
        });
    }

    public function down(): void
    {
        Schema::table('tuition_applications', function (Blueprint $table) {
            $table->dropConstrainedForeignId('hired_by');
            $table->dropColumn(['admin_contact_status', 'admin_note', 'hired_at']);
        });
    }
};
