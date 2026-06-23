<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Backfill the newer class-level capability column from legacy level buckets.
     */
    public function up(): void
    {
        $legacyMap = [
            'primary' => ['nursery', 'kg', '1', '2', '3', '4', '5'],
            'high_school' => ['6', '7', '8', '9', '10'],
            'college' => ['11', '12'],
        ];

        DB::table('tutor_profiles')
            ->select(['id', 'teachable_levels', 'teachable_classes'])
            ->orderBy('id')
            ->chunkById(100, function ($profiles) use ($legacyMap): void {
                foreach ($profiles as $profile) {
                    $legacyLevels = json_decode($profile->teachable_levels ?? '[]', true) ?: [];
                    $existingClasses = json_decode($profile->teachable_classes ?? '[]', true) ?: [];

                    if (! empty($existingClasses) || empty($legacyLevels)) {
                        continue;
                    }

                    $backfilledClasses = [];

                    foreach ($legacyLevels as $legacyLevel) {
                        if (! isset($legacyMap[$legacyLevel])) {
                            continue;
                        }

                        $backfilledClasses = array_merge($backfilledClasses, $legacyMap[$legacyLevel]);
                    }

                    $backfilledClasses = array_values(array_unique($backfilledClasses));

                    if ($backfilledClasses === []) {
                        continue;
                    }

                    DB::table('tutor_profiles')
                        ->where('id', $profile->id)
                        ->update([
                            'teachable_classes' => json_encode($backfilledClasses),
                        ]);
                }
            });
    }

    public function down(): void
    {
        // Intentionally left blank. This migration only restores derived data.
    }
};
