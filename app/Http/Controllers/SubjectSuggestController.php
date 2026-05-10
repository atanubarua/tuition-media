<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SubjectSuggestController extends Controller
{
    public function __invoke(Request $request)
    {
        $query = $request->query('q', '');

        if (strlen($query) < 2) {
            return response()->json([]);
        }

        return response()->json(
            DB::table('subjects')
                ->where('name', 'like', "%{$query}%")
                ->where('is_active', true)
                ->limit(8)
                ->pluck('name')
        );
    }
}
