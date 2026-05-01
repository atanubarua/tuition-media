<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class LocationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $payload = $this->loadPayload();

        $now = now();

        DB::transaction(function () use ($payload, $now): void {
            foreach ($payload['divisions'] as $division) {
                $divisionName = $this->cleanName($division['name'] ?? null);

                if ($divisionName === null) {
                    continue;
                }

                DB::table('divisions')->updateOrInsert(
                    ['name' => $divisionName],
                    [
                        'slug' => Str::slug($divisionName),
                        'is_active' => true,
                        'updated_at' => $now,
                        'created_at' => $now,
                    ]
                );

                $divisionRow = DB::table('divisions')->where('name', $divisionName)->first(['id']);
                if (! $divisionRow) {
                    continue;
                }

                $districts = $division['districts'] ?? [];
                if (! is_array($districts)) {
                    continue;
                }

                foreach ($districts as $district) {
                    $districtName = $this->cleanName($district['name'] ?? null);
                    if ($districtName === null) {
                        continue;
                    }

                    DB::table('districts')->updateOrInsert(
                        [
                            'division_id' => $divisionRow->id,
                            'name' => $districtName,
                        ],
                        [
                            'slug' => Str::slug($districtName),
                            'is_active' => true,
                            'updated_at' => $now,
                            'created_at' => $now,
                        ]
                    );

                    $districtRow = DB::table('districts')
                        ->where('division_id', $divisionRow->id)
                        ->where('name', $districtName)
                        ->first(['id']);

                    if (! $districtRow) {
                        continue;
                    }

                    $subdistricts = $district['subdistricts'] ?? $district['upazilas'] ?? [];
                    if (! is_array($subdistricts)) {
                        continue;
                    }

                    foreach ($subdistricts as $subdistrict) {
                        $subdistrictName = null;
                        $subdistrictType = 'upazila';

                        if (is_string($subdistrict)) {
                            $subdistrictName = $this->cleanName($subdistrict);
                        } elseif (is_array($subdistrict)) {
                            $subdistrictName = $this->cleanName($subdistrict['name'] ?? null);
                            $candidateType = $subdistrict['type'] ?? null;
                            if (in_array($candidateType, ['upazila', 'thana'], true)) {
                                $subdistrictType = $candidateType;
                            }
                        }

                        if ($subdistrictName === null) {
                            continue;
                        }

                        DB::table('subdistricts')->updateOrInsert(
                            [
                                'district_id' => $districtRow->id,
                                'name' => $subdistrictName,
                                'type' => $subdistrictType,
                            ],
                            [
                                'slug' => Str::slug($subdistrictName),
                                'is_active' => true,
                                'updated_at' => $now,
                                'created_at' => $now,
                            ]
                        );
                    }
                }
            }

            $this->seedSupplementalThanas($now);
        });
    }

    private function loadPayload(): array
    {
        $primaryFile = database_path('data/bd_locations.json');
        $legacyFile = database_path('data/bd_locations_source.json');

        $file = file_exists($primaryFile) ? $primaryFile : $legacyFile;

        if (! file_exists($file)) {
            throw new \RuntimeException("Location data file not found. Expected {$primaryFile} or {$legacyFile}");
        }

        $json = file_get_contents($file);
        if ($json === false) {
            throw new \RuntimeException("Unable to read location source file: {$file}");
        }

        $payload = json_decode($json, true);

        if (! is_array($payload) || ! isset($payload['divisions']) || ! is_array($payload['divisions'])) {
            throw new \RuntimeException('Invalid location JSON format. Expected top-level "divisions" array.');
        }

        return $payload;
    }

    private function seedSupplementalThanas($now): void
    {
        $file = database_path('data/bd_thana_supplement.json');
        if (! file_exists($file)) {
            return;
        }

        $raw = file_get_contents($file);
        if ($raw === false) {
            return;
        }

        $payload = json_decode($raw, true);
        if (! is_array($payload) || ! isset($payload['districts']) || ! is_array($payload['districts'])) {
            return;
        }

        foreach ($payload['districts'] as $row) {
            $districtName = $this->cleanName($row['district'] ?? null);
            if ($districtName === null) {
                continue;
            }

            $district = DB::table('districts')->where('name', $districtName)->first(['id']);
            if (! $district) {
                continue;
            }

            $thanas = $row['thanas'] ?? [];
            if (! is_array($thanas)) {
                continue;
            }

            foreach ($thanas as $thana) {
                $thanaName = $this->cleanName(is_string($thana) ? $thana : null);
                if ($thanaName === null) {
                    continue;
                }

                DB::table('subdistricts')->updateOrInsert(
                    [
                        'district_id' => $district->id,
                        'slug' => Str::slug($thanaName),
                        'type' => 'thana',
                    ],
                    [
                        'name' => $thanaName,
                        'is_active' => true,
                        'updated_at' => $now,
                        'created_at' => $now,
                    ]
                );
            }
        }
    }

    private function cleanName(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $name = trim($value);

        if ($name === '') {
            return null;
        }

        // Normalize inconsistent spellings/markers found in third-party datasets.
        $name = str_replace(['-S', ' Sadar Upazila'], [' Sadar', ' Sadar'], $name);
        $name = preg_replace('/\s+/', ' ', $name);

        return $name === '' ? null : $name;
    }
}
