<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tuition_applications', function (Blueprint $table): void {
            $table->date('commission_due_date')->nullable()->after('commission_paid_at');
        });

        Schema::table('commission_payments', function (Blueprint $table): void {
            $table->date('due_on')->nullable()->after('received_at');
        });

        $now = now();

        $applications = DB::table('tuition_applications')
            ->where('status', 'hired')
            ->where('commission_received_amount', '>', 0)
            ->whereNotNull('commission_received_amount')
            ->whereNotExists(function ($query): void {
                $query->selectRaw('1')
                    ->from('commission_payments')
                    ->whereColumn('commission_payments.tuition_application_id', 'tuition_applications.id');
            })
            ->select('id', 'commission_received_amount', 'hired_by', 'hired_at', 'created_at', 'updated_at')
            ->get();

        if ($applications->isNotEmpty()) {
            $rows = $applications->map(fn ($application) => [
                'tuition_application_id' => $application->id,
                'amount' => (int) $application->commission_received_amount,
                'received_by' => $application->hired_by,
                'note' => 'Initial payment recovered from existing commission record.',
                'received_at' => $application->hired_at ?? $application->updated_at ?? $application->created_at ?? $now,
                'due_on' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ])->all();

            DB::table('commission_payments')->insert($rows);
        }
    }

    public function down(): void
    {
        Schema::table('commission_payments', function (Blueprint $table): void {
            $table->dropColumn('due_on');
        });

        Schema::table('tuition_applications', function (Blueprint $table): void {
            $table->dropColumn('commission_due_date');
        });
    }
};
