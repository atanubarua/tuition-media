<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LocationSuggestController extends Controller
{
    public function __invoke(Request $request)
    {
        $query = $request->query('q', '');

        if (strlen($query) < 2) {
            return response()->json([]);
        }

        $divisions = DB::table('divisions')
            ->where('name', 'like', "%{$query}%")
            ->limit(3)
            ->get(['name'])
            ->map(fn ($r) => ['name' => $r->name, 'label' => $r->name]);

        $districts = DB::table('districts')
            ->join('divisions', 'districts.division_id', '=', 'divisions.id')
            ->where('districts.name', 'like', "%{$query}%")
            ->limit(4)
            ->get(['districts.name', 'divisions.name as division_name'])
            ->map(fn ($r) => ['name' => $r->name, 'label' => "{$r->name}, {$r->division_name}"]);

        $subdistricts = DB::table('subdistricts')
            ->join('districts', 'subdistricts.district_id', '=', 'districts.id')
            ->join('divisions', 'districts.division_id', '=', 'divisions.id')
            ->where('subdistricts.name', 'like', "%{$query}%")
            ->limit(6)
            ->get(['subdistricts.name', 'districts.name as district_name', 'divisions.name as division_name'])
            ->map(fn ($r) => ['name' => $r->name, 'label' => "{$r->name}, {$r->district_name}, {$r->division_name}"]);

        return response()->json($divisions->merge($districts)->merge($subdistricts)->values());
    }
}
