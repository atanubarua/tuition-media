<?php

namespace App\Http\Controllers;

use App\Models\TuitionPost;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TuitionJobController extends Controller
{
    public function index(Request $request): Response
    {
        $location = trim($request->string('location')->toString());
        $subject = trim($request->string('subject')->toString());
        $gender = trim($request->string('gender')->toString());
        $level = trim($request->string('level')->toString());
        $minSalary = $request->integer('min_salary');
        $maxDays = $request->integer('max_days');

        $posts = TuitionPost::query()
            ->whereIn('status', ['published', 'shortlisted'])
            ->with([
                'students.subjects:id,name',
                'guardian:id,name',
            ])
            ->join('districts', 'tuition_posts.district_id', '=', 'districts.id')
            ->join('subdistricts', 'tuition_posts.subdistrict_id', '=', 'subdistricts.id')
            ->select('tuition_posts.*', 'districts.name as district_name', 'subdistricts.name as subdistrict_name')
            ->when($location !== '', function ($query) use ($location): void {
                $query->where(function ($q) use ($location): void {
                    $q->where('districts.name', 'like', "%{$location}%")
                        ->orWhere('subdistricts.name', 'like', "%{$location}%");
                });
            })
            ->when($subject !== '', function ($query) use ($subject): void {
                $query->where(function ($q) use ($subject): void {
                    $q->where('tuition_posts.title', 'like', "%{$subject}%")
                        ->orWhereHas('students.subjects', function ($subjectQuery) use ($subject): void {
                            $subjectQuery->where('subjects.name', 'like', "%{$subject}%");
                        });
                });
            })
            ->when(in_array($gender, ['male', 'female', 'any'], true), function ($query) use ($gender): void {
                if ($gender !== 'any') {
                    $query->where('tuition_posts.tutor_gender_preference', $gender);
                }
            })
            ->when($level !== '', function ($query) use ($level): void {
                $query->whereHas('students', function ($studentQuery) use ($level): void {
                    $studentQuery->where('academic_level', $level);
                });
            })
            ->when($minSalary > 0, function ($query) use ($minSalary): void {
                $query->where(function ($q) use ($minSalary): void {
                    $q->where('salary_type', 'negotiable')
                        ->orWhere('salary_min', '>=', $minSalary)
                        ->orWhere('salary_max', '>=', $minSalary);
                });
            })
            ->when($maxDays > 0, function ($query) use ($maxDays): void {
                $query->where('days_per_week', '<=', $maxDays);
            })
            ->latest('tuition_posts.published_at')
            ->paginate(12)
            ->withQueryString();

        $locale = session('locale', config('app.locale'));
        app()->setLocale($locale);

        return Inertia::render('tuition-jobs/index', [
            'posts' => $posts,
            'filters' => [
                'location' => $location,
                'subject' => $subject,
                'gender' => in_array($gender, ['male', 'female', 'any'], true) ? $gender : 'any',
                'level' => $level,
                'min_salary' => $minSalary > 0 ? $minSalary : null,
                'max_days' => $maxDays > 0 ? $maxDays : null,
            ],
            'locale' => $locale,
        ]);
    }
}
