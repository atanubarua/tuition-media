<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TuitionPost;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TuitionPostController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->string('status')->toString();
        $tuitionCode = $request->string('tuition_code')->toString();
        $guardianName = $request->string('guardian_name')->toString();

        $posts = TuitionPost::query()
            ->withCount([
                'students',
                'applications',
                'applications as pending_applications_count' => fn ($query) => $query->where('status', 'pending'),
                'applications as shortlisted_applications_count' => fn ($query) => $query->where('status', 'shortlisted'),
                'applications as rejected_applications_count' => fn ($query) => $query->where('status', 'rejected'),
                'applications as hired_applications_count' => fn ($query) => $query->where('status', 'hired'),
            ])
            ->with(['guardian:id,name,email,phone'])
            ->when($status !== '', fn ($query) => $query->where('status', $status))
            ->when($tuitionCode !== '', fn ($query) => $query->where('tuition_code', 'like', "%{$tuitionCode}%"))
            ->when($guardianName !== '', function ($query) use ($guardianName) {
                $query->whereHas('guardian', fn ($guardianQuery) => $guardianQuery->where('name', 'like', "%{$guardianName}%"));
            })
            ->latest()
            ->paginate(20)
            ->withQueryString()
            ->through(fn (TuitionPost $post) => [
                'id' => $post->id,
                'tuition_code' => $post->tuition_code,
                'title' => $post->title,
                'status' => $post->status,
                'salary_type' => $post->salary_type,
                'salary_min' => $post->salary_min,
                'salary_max' => $post->salary_max,
                'days_per_week' => $post->days_per_week,
                'students_count' => $post->students_count,
                'applications_count' => $post->applications_count,
                'application_status_counts' => [
                    'pending' => $post->pending_applications_count,
                    'shortlisted' => $post->shortlisted_applications_count,
                    'rejected' => $post->rejected_applications_count,
                    'hired' => $post->hired_applications_count,
                ],
                'guardian' => $post->guardian ? [
                    'id' => $post->guardian->id,
                    'name' => $post->guardian->name,
                    'email' => $post->guardian->email,
                    'phone' => $post->guardian->phone,
                ] : null,
                'created_at' => $post->created_at,
            ]);

        return Inertia::render('admin/tuition-posts/index', [
            'posts' => $posts,
            'filters' => [
                'status' => $status,
                'tuition_code' => $tuitionCode,
                'guardian_name' => $guardianName,
            ],
            'statuses' => ['draft', 'published', 'shortlisted', 'assigned', 'completed', 'closed', 'cancelled'],
        ]);
    }

    public function show(TuitionPost $tuitionPost): Response
    {
        $tuitionPost->load([
            'students.subjects:id,name',
            'preferredUniversities:id,name',
            'guardian:id,name,email',
        ]);

        $location = \Illuminate\Support\Facades\DB::table('subdistricts')
            ->join('districts', 'subdistricts.district_id', '=', 'districts.id')
            ->join('divisions', 'districts.division_id', '=', 'divisions.id')
            ->where('subdistricts.id', $tuitionPost->subdistrict_id)
            ->select('subdistricts.name as subdistrict', 'districts.name as district', 'divisions.name as division')
            ->first();

        return Inertia::render('admin/tuition-posts/show', [
            'post' => [
                'id' => $tuitionPost->id,
                'tuition_code' => $tuitionPost->tuition_code,
                'title' => $tuitionPost->title,
                'status' => $tuitionPost->status,
                'salary_type' => $tuitionPost->salary_type,
                'salary_min' => $tuitionPost->salary_min,
                'salary_max' => $tuitionPost->salary_max,
                'days_per_week' => $tuitionPost->days_per_week,
                'duration_months' => $tuitionPost->duration_months,
                'preferred_time_slots' => $tuitionPost->preferred_time_slots,
                'tutor_gender_preference' => $tuitionPost->tutor_gender_preference,
                'required_experience_months' => $tuitionPost->required_experience_months,
                'special_requirements' => $tuitionPost->special_requirements,
                'address_line' => $tuitionPost->address_line,
                'published_at' => $tuitionPost->published_at,
                'created_at' => $tuitionPost->created_at,
                'guardian' => $tuitionPost->guardian ? [
                    'id' => $tuitionPost->guardian->id,
                    'name' => $tuitionPost->guardian->name,
                    'email' => $tuitionPost->guardian->email,
                ] : null,
                'students' => $tuitionPost->students->map(fn ($student) => [
                    'id' => $student->id,
                    'class_level' => $student->class_level,
                    'curriculum' => $student->curriculum,
                    'subjects' => $student->subjects->map(fn ($subject) => [
                        'id' => $subject->id,
                        'name' => $subject->name,
                    ])->values(),
                ])->values(),
                'preferred_universities' => $tuitionPost->preferredUniversities->map(fn ($university) => [
                    'id' => $university->id,
                    'name' => $university->name,
                ])->values(),
                'applications_count' => $tuitionPost->applications()->count(),
            ],
            'location' => $location,
        ]);
    }
}
