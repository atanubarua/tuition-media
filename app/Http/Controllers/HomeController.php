<?php

namespace App\Http\Controllers;

use App\Models\TuitionPost;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $posts = TuitionPost::query()
            ->where('status', 'published')
            ->with([
                'students.subjects:id,name',
                'guardian:id,name',
            ])
            ->join('districts', 'tuition_posts.district_id', '=', 'districts.id')
            ->join('subdistricts', 'tuition_posts.subdistrict_id', '=', 'subdistricts.id')
            ->select('tuition_posts.*', 'districts.name as district_name', 'subdistricts.name as subdistrict_name')
            ->latest('tuition_posts.published_at')
            ->limit(12)
            ->get();

        $stats = [
            'total_posts' => TuitionPost::where('status', 'published')->count(),
            'total_tutors' => DB::table('tutor_profiles')->count(),
        ];

        return Inertia::render('welcome', [
            'canRegister' => \Laravel\Fortify\Features::enabled(\Laravel\Fortify\Features::registration()),
            'posts' => $posts,
            'stats' => $stats,
        ]);
    }
}
