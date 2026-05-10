<?php

namespace App\Http\Controllers\Guardian;

use App\Http\Controllers\Controller;
use App\Models\TuitionApplication;
use App\Models\TuitionPost;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ApplicationsController extends Controller
{
    public function __invoke(Request $request): Response
    {
        abort_unless($request->user()->role === 'guardian', 403);

        $postIds = TuitionPost::query()
            ->where('guardian_id', $request->user()->id)
            ->pluck('id');

        $status = $request->string('status')->toString();
        $search = trim($request->string('search')->toString());

        $applications = TuitionApplication::query()
            ->with([
                'tuitionPost:id,title',
                'tutor.tutorProfile.university:id,name',
            ])
            ->whereIn('tuition_post_id', $postIds)
            ->when(
                $status !== '' && in_array($status, ['pending', 'shortlisted', 'interested', 'not_interested', 'rejected', 'hired'], true),
                fn ($query) => $query->where('status', $status)
            )
            ->when($search !== '', function ($query) use ($search): void {
                $query->whereHas('tutor', fn ($q) => $q->where('name', 'like', '%' . $search . '%'));
            })
            ->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(fn ($app) => [
                'id' => $app->id,
                'status' => $app->status,
                'expected_salary' => $app->expected_salary,
                'created_at' => $app->created_at,
                'post' => [
                    'id' => $app->tuitionPost?->id,
                    'title' => $app->tuitionPost?->title,
                ],
                'tutor' => [
                    'id' => $app->tutor->id,
                    'name' => $app->tutor->name,
                    'gender' => $app->tutor->gender,
                    'university' => $app->tutor->tutorProfile?->university?->name,
                    'department' => $app->tutor->tutorProfile?->department,
                ],
            ]);

        return Inertia::render('guardian/applications', [
            'applications' => $applications,
            'filters' => [
                'status' => $status,
                'search' => $search,
            ],
        ]);
    }
}
