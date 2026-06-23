<?php

use App\Models\TutorRequest;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        TutorRequest::query()
            ->whereNull('request_group_id')
            ->orderBy('guardian_id')
            ->orderBy('tutor_id')
            ->orderBy('division_id')
            ->orderBy('district_id')
            ->orderBy('subdistrict_id')
            ->orderBy('created_at')
            ->orderBy('id')
            ->get([
                'id',
                'guardian_id',
                'tutor_id',
                'division_id',
                'district_id',
                'subdistrict_id',
                'created_at',
            ])
            ->groupBy(function (TutorRequest $request): string {
                return implode('|', [
                    $request->guardian_id,
                    $request->tutor_id,
                    $request->division_id ?? 'null',
                    $request->district_id ?? 'null',
                    $request->subdistrict_id ?? 'null',
                    $request->created_at?->format('Y-m-d H:i'),
                ]);
            })
            ->each(function ($group): void {
                $groupId = (string) Str::uuid();

                foreach ($group as $request) {
                    $request->forceFill(['request_group_id' => $groupId])->save();
                }
            });
    }

    public function down(): void
    {
        TutorRequest::query()
            ->whereNotNull('request_group_id')
            ->update(['request_group_id' => null]);
    }
};
