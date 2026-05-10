<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $posts = DB::table('tuition_posts')->orderBy('id')->pluck('id');

        foreach ($posts as $index => $id) {
            DB::table('tuition_posts')
                ->where('id', $id)
                ->update(['tuition_code' => 'TID' . str_pad($index + 1, 8, '0', STR_PAD_LEFT)]);
        }
    }

    public function down(): void
    {
        // Irreversible data transformation
    }
};
