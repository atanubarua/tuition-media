<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tuition_applications', function (Blueprint $table) {
            $table->enum('commission_type', ['fixed', 'percentage'])->nullable()->after('hired_at');
            $table->decimal('commission_value', 10, 2)->nullable()->after('commission_type');
            $table->unsignedInteger('commission_amount')->nullable()->after('commission_value');
            $table->unsignedInteger('commission_received_amount')->default(0)->after('commission_amount');
            $table->enum('commission_payment_status', ['unpaid', 'partial', 'paid'])->default('unpaid')->after('commission_received_amount');
            $table->timestamp('commission_paid_at')->nullable()->after('commission_payment_status');
        });
    }

    public function down(): void
    {
        Schema::table('tuition_applications', function (Blueprint $table) {
            $table->dropColumn([
                'commission_type',
                'commission_value',
                'commission_amount',
                'commission_received_amount',
                'commission_payment_status',
                'commission_paid_at',
            ]);
        });
    }
};
