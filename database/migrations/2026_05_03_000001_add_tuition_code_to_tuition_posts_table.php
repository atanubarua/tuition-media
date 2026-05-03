<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tuition_posts', function (Blueprint $table): void {
            $table->string('tuition_code', 32)->nullable()->unique()->after('id');
        });

        DB::table('tuition_posts')
            ->select('id')
            ->whereNull('tuition_code')
            ->orderBy('id')
            ->chunkById(200, function ($posts): void {
                foreach ($posts as $post) {
                    do {
                        $code = 'TID' . strtoupper(Str::random(8));
                    } while (DB::table('tuition_posts')->where('tuition_code', $code)->exists());

                    DB::table('tuition_posts')
                        ->where('id', $post->id)
                        ->update(['tuition_code' => $code]);
                }
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tuition_posts', function (Blueprint $table): void {
            $table->dropUnique(['tuition_code']);
            $table->dropColumn('tuition_code');
        });
    }
};
