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
        $supportedLocales = ['en', 'bn'];
        $locale = $request->query('lang');

        if (! is_string($locale) || ! in_array($locale, $supportedLocales, true)) {
            $locale = $request->session()->get('locale', config('app.locale'));
        }

        if (! in_array($locale, $supportedLocales, true)) {
            $locale = config('app.fallback_locale');
        }

        app()->setLocale($locale);
        $request->session()->put('locale', $locale);

        $posts = TuitionPost::query()
            ->whereIn('status', ['published', 'shortlisted'])
            ->with([
                'students.subjects:id,name',
                'guardian:id,name',
            ])
            ->join('districts', 'tuition_posts.district_id', '=', 'districts.id')
            ->join('subdistricts', 'tuition_posts.subdistrict_id', '=', 'subdistricts.id')
            ->select('tuition_posts.*', 'districts.name as district_name', 'subdistricts.name as subdistrict_name')
            ->latest('tuition_posts.published_at')
            ->limit(6)
            ->get();

        $stats = [
            'total_posts' => TuitionPost::whereIn('status', ['published', 'shortlisted'])->count(),
            'total_tutors' => DB::table('tutor_profiles')->count(),
        ];

        return Inertia::render('welcome', [
            'canRegister' => \Laravel\Fortify\Features::enabled(\Laravel\Fortify\Features::registration()),
            'posts' => $posts,
            'stats' => $stats,
            'locale' => $locale,
        ]);
    }
}
