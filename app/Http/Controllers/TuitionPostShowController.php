<?php

namespace App\Http\Controllers;

use App\Models\TuitionApplication;
use App\Models\TuitionPost;
use App\Models\TutorProfile;
use Inertia\Inertia;
use Inertia\Response;

class TuitionPostShowController extends Controller
{
    public function __invoke(TuitionPost $tuitionPost): Response
    {
        abort_unless($tuitionPost->status === 'published', 404);

        $tuitionPost->load([
            'students.subjects:id,name',
            'preferredUniversities:id,name',
            'guardian:id,name',
        ]);

        $location = \Illuminate\Support\Facades\DB::table('subdistricts')
            ->join('districts', 'subdistricts.district_id', '=', 'districts.id')
            ->join('divisions', 'districts.division_id', '=', 'divisions.id')
            ->where('subdistricts.id', $tuitionPost->subdistrict_id)
            ->select('subdistricts.name as subdistrict', 'districts.name as district', 'divisions.name as division')
            ->first();

        $user = auth()->user();
        $hasApplied = $user && $user->role === 'tutor'
            ? TuitionApplication::where('tuition_post_id', $tuitionPost->id)
                ->where('tutor_id', $user->id)
                ->exists()
            : false;

        $profileIncomplete = $user && $user->role === 'tutor'
            ? !TutorProfile::where('user_id', $user->id)->exists()
            : false;

        $rawCount = TuitionApplication::where('tuition_post_id', $tuitionPost->id)->count();
        $applicantCount = match(true) {
            $rawCount === 0    => 'Be the first to apply',
            $rawCount <= 5    => 'Less than 5',
            $rawCount <= 10   => '5–10',
            $rawCount <= 20   => '10–20',
            $rawCount <= 50   => '20–50',
            default           => '50+',
        };

        $locale = session('locale', config('app.locale'));
        app()->setLocale($locale);

        return Inertia::render('tuition-posts/show', [
            'post' => $tuitionPost,
            'location' => $location,
            'has_applied' => $hasApplied,
            'applicant_count' => $applicantCount,
            'profile_incomplete' => $profileIncomplete,
            'locale' => $locale,
            'translations' => trans($locale),
        ]);
    }
}
