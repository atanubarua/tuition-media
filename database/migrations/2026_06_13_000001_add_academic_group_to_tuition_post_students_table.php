<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tuition_post_students', function (Blueprint $table): void {
            $table->enum('academic_group', ['science', 'commerce', 'arts'])
                ->nullable()
                ->after('class_level');

            $table->index('class_level', 'tuition_post_students_class_level_index');
            $table->index('academic_group', 'tuition_post_students_academic_group_index');
            $table->index(['class_level', 'academic_group'], 'tuition_post_students_class_level_academic_group_index');
        });
    }

    public function down(): void
    {
        Schema::table('tuition_post_students', function (Blueprint $table): void {
            $table->dropIndex('tuition_post_students_class_level_index');
            $table->dropIndex('tuition_post_students_academic_group_index');
            $table->dropIndex('tuition_post_students_class_level_academic_group_index');
            $table->dropColumn('academic_group');
        });
    }
};
