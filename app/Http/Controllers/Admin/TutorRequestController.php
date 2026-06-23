<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TuitionApplication;
use App\Models\TuitionPost;
use App\Models\TuitionPostStudent;
use App\Models\TutorRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Pagination\Paginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class TutorRequestController extends Controller
{
    public function index(Request $request): Response
    {
        $status   = $request->string('status')->toString();
        $tutor    = trim($request->string('tutor')->toString());
        $guardian = trim($request->string('guardian')->toString());
        $location = trim($request->string('location')->toString());

        $rows = TutorRequest::query()
            ->with([
                'guardian:id,name,email,phone',
                'tutor:id,name,email,phone,gender',
            ])
            ->select([
                'id',
                'request_group_id',
                'guardian_id',
                'tutor_id',
                'division_id',
                'district_id',
                'subdistrict_id',
                'class_level',
                'academic_group',
                'message',
                'status',
                'admin_note',
                'tuition_post_id',
                'assigned_tutor_id',
                'assigned_at',
                'created_at',
            ])
            ->when($status !== '', fn ($q) => $q->where('status', $status))
            ->when($tutor !== '', fn ($q) => $q->whereHas('tutor', fn ($u) =>
                $u->where('name', 'like', "%{$tutor}%")
                  ->orWhere('phone', 'like', "%{$tutor}%")
            ))
            ->when($guardian !== '', fn ($q) => $q->whereHas('guardian', fn ($u) =>
                $u->where('name', 'like', "%{$guardian}%")
                  ->orWhere('phone', 'like', "%{$guardian}%")
            ))
            ->when($location !== '', function ($q) use ($location) {
                $like = "%{$location}%";
                $subdistrictIds = DB::table('subdistricts')->where('name', 'like', $like)->pluck('id');
                $districtIds    = DB::table('districts')->where('name', 'like', $like)->pluck('id');
                $divisionIds    = DB::table('divisions')->where('name', 'like', $like)->pluck('id');

                $q->where(function ($inner) use ($subdistrictIds, $districtIds, $divisionIds) {
                    $inner->whereIn('subdistrict_id', $subdistrictIds)
                          ->orWhereIn('district_id', $districtIds)
                          ->orWhereIn('division_id', $divisionIds);
                });
            })
            ->latest()
            ->get();

        $grouped = $rows
            ->groupBy(fn (TutorRequest $requestRow) => $requestRow->request_group_id ?: "legacy-{$requestRow->id}")
            ->map(function (Collection $group) {
                /** @var TutorRequest $first */
                $first = $group->first();

                return [
                    'id' => $first->id,
                    'request_group_id' => $first->request_group_id,
                    'status' => $first->status === 'reviewed' ? 'contacted' : $first->status,
                    'class_level' => $first->class_level,
                    'academic_group' => $first->academic_group,
                    'location' => $this->resolveLocationLabel(
                        $first->division_id,
                        $first->district_id,
                        $first->subdistrict_id
                    ),
                    'message' => $group->pluck('message')->filter()->implode("\n\n---\n\n"),
                    'admin_note' => $group->pluck('admin_note')->filter()->implode("\n\n---\n\n"),
                    'created_at' => $first->created_at,
                    'student_count' => $group->count(),
                    'students' => $group->values()->map(fn (TutorRequest $requestRow) => [
                        'id' => $requestRow->id,
                        'class_level' => $requestRow->class_level,
                        'academic_group' => $requestRow->academic_group,
                        'message' => $requestRow->message,
                    ])->all(),
                    'tuition_post_id' => $first->tuition_post_id,
                    'assigned_tutor_id' => $first->assigned_tutor_id,
                    'assigned_at' => $first->assigned_at,
                    'guardian' => $first->guardian ? [
                        'id' => $first->guardian->id,
                        'name' => $first->guardian->name,
                        'email' => $first->guardian->email,
                        'phone' => $first->guardian->phone,
                    ] : null,
                    'tutor' => $first->tutor ? [
                        'id' => $first->tutor->id,
                        'name' => $first->tutor->name,
                        'email' => $first->tutor->email,
                        'phone' => $first->tutor->phone,
                        'gender' => $first->tutor->gender,
                    ] : null,
                ];
            })
            ->sortByDesc(fn (array $requestRow) => $requestRow['created_at'])
            ->values();

        $page = Paginator::resolveCurrentPage();
        $perPage = 50;
        $items = $grouped->forPage($page, $perPage)->values();
        $requests = new LengthAwarePaginator($items, $grouped->count(), $perPage, $page, [
            'path' => Paginator::resolveCurrentPath(),
            'query' => $request->query(),
        ]);

        return Inertia::render('admin/tutor-requests/index', [
            'requests' => $requests,
            'filters' => [
                'status'   => $status,
                'tutor'    => $tutor,
                'guardian' => $guardian,
                'location' => $location,
            ],
            'statuses' => ['pending', 'contacted', 'assigned', 'rejected'],
        ]);
    }

    public function update(Request $request, TutorRequest $tutorRequest): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['pending', 'contacted', 'assigned', 'rejected'])],
            'admin_note' => ['nullable', 'string', 'max:2000'],
        ]);

        if ($validated['status'] === 'assigned' && $tutorRequest->tuition_post_id === null) {
            return back()->with('toast', [
                'type' => 'error',
                'message' => 'Use Assign & Create Tuition to convert a tutor request into a tuition post.',
            ]);
        }

        $groupId = $tutorRequest->request_group_id;

        TutorRequest::query()
            ->when(
                $groupId !== null,
                fn ($query) => $query->where('request_group_id', $groupId),
                fn ($query) => $query->whereKey($tutorRequest->id)
            )
            ->update([
                'status' => $validated['status'],
                'admin_note' => $validated['admin_note'] ?? $tutorRequest->admin_note,
                'contacted_at' => $validated['status'] === 'contacted' ? now() : $tutorRequest->contacted_at,
                'closed_at' => in_array($validated['status'], ['rejected', 'archived'], true) ? now() : $tutorRequest->closed_at,
            ]);

        return back()->with('toast', [
            'type' => 'success',
            'message' => 'Tutor request updated.',
        ]);
    }

    public function assign(Request $request, TutorRequest $tutorRequest): RedirectResponse
    {
        $validated = $request->validate([
            'admin_note' => ['nullable', 'string', 'max:2000'],
        ]);

        $groupRequests = $this->loadGroupRequests($tutorRequest);
        $leadRequest = $groupRequests->first();

        abort_if(! $leadRequest, 404);
        abort_if($leadRequest->tutor_id === null, 422, 'Tutor is required for assignment.');
        abort_if($leadRequest->tuition_post_id !== null, 409, 'This tutor request has already been assigned.');

        $tuitionPost = DB::transaction(function () use ($groupRequests, $leadRequest): TuitionPost {
            $tuitionPost = TuitionPost::create([
                'guardian_id' => $leadRequest->guardian_id,
                'title' => $this->buildTuitionTitle($groupRequests),
                'division_id' => $leadRequest->division_id,
                'district_id' => $leadRequest->district_id,
                'subdistrict_id' => $leadRequest->subdistrict_id,
                'address_line' => null,
                'salary_type' => 'negotiable',
                'salary_min' => null,
                'salary_max' => null,
                'days_per_week' => 1,
                'preferred_time_slots' => null,
                'duration_months' => null,
                'tutor_gender_preference' => 'any',
                'required_experience_months' => null,
                'special_requirements' => $this->buildSpecialRequirements($groupRequests),
                'status' => 'assigned',
                'published_at' => null,
            ]);

            foreach ($groupRequests as $index => $groupRequest) {
                TuitionPostStudent::create([
                    'tuition_post_id' => $tuitionPost->id,
                    'student_name' => 'Student ' . ($index + 1),
                    'academic_level' => $this->mapAcademicLevel((string) $groupRequest->class_level),
                    'class_level' => $groupRequest->class_level,
                    'academic_group' => $groupRequest->academic_group,
                    'honors_subject' => null,
                    'medium' => 'bangla',
                ]);
            }

            TuitionApplication::create([
                'tuition_post_id' => $tuitionPost->id,
                'tutor_id' => $leadRequest->tutor_id,
                'cover_note' => 'Auto-created from tutor request assignment.',
                'expected_salary' => null,
                'status' => 'interested',
            ]);

            TutorRequest::query()
                ->when(
                    $leadRequest->request_group_id !== null,
                    fn ($query) => $query->where('request_group_id', $leadRequest->request_group_id),
                    fn ($query) => $query->whereKey($leadRequest->id)
                )
                ->update([
                    'tuition_post_id' => $tuitionPost->id,
                    'assigned_tutor_id' => $leadRequest->tutor_id,
                    'status' => 'assigned',
                    'assigned_at' => now(),
                    'closed_at' => null,
                    'admin_note' => $validated['admin_note'] ?? $leadRequest->admin_note,
                ]);

            return $tuitionPost;
        });

        return to_route('admin.applications.index', [
            'tuition_code' => $tuitionPost->tuition_code,
        ])->with('toast', [
            'type' => 'success',
            'message' => 'Tutor request assigned and tuition created.',
        ]);
    }

    private function resolveLocationLabel(?int $divisionId, ?int $districtId, ?int $subdistrictId): ?string
    {
        if (! $divisionId && ! $districtId && ! $subdistrictId) {
            return null;
        }

        $division = $divisionId ? DB::table('divisions')->where('id', $divisionId)->value('name') : null;
        $district = $districtId ? DB::table('districts')->where('id', $districtId)->value('name') : null;
        $subdistrict = $subdistrictId ? DB::table('subdistricts')->where('id', $subdistrictId)->value('name') : null;

        return collect([$subdistrict, $district, $division])->filter()->implode(', ') ?: null;
    }

    /**
     * @return \Illuminate\Support\Collection<int, TutorRequest>
     */
    private function loadGroupRequests(TutorRequest $tutorRequest): Collection
    {
        $query = TutorRequest::query()
            ->select([
                'id',
                'request_group_id',
                'guardian_id',
                'tutor_id',
                'division_id',
                'district_id',
                'subdistrict_id',
                'class_level',
                'academic_group',
                'message',
                'status',
                'admin_note',
                'tuition_post_id',
                'created_at',
            ])
            ->with(['guardian:id,name,email,phone', 'tutor:id,name,email,phone,gender']);

        if ($tutorRequest->request_group_id !== null) {
            return $query->where('request_group_id', $tutorRequest->request_group_id)->orderBy('id')->get();
        }

        return $query->whereKey($tutorRequest->id)->orderBy('id')->get();
    }

    /**
     * @param  \Illuminate\Support\Collection<int, TutorRequest>  $groupRequests
     */
    private function buildTuitionTitle(Collection $groupRequests): string
    {
        $parts = $groupRequests->map(function (TutorRequest $request): string {
            $label = 'Class ' . ($request->class_level ?? '-');

            if ($request->academic_group) {
                $label .= ' ' . $request->academic_group;
            }

            return $label;
        })->filter()->values();

        return 'Tutor Request - ' . $parts->implode(', ');
    }

    /**
     * @param  \Illuminate\Support\Collection<int, TutorRequest>  $groupRequests
     */
    private function buildSpecialRequirements(Collection $groupRequests): ?string
    {
        $lines = $groupRequests->map(function (TutorRequest $request): string {
            $line = 'Class ' . ($request->class_level ?? '-');

            if ($request->academic_group) {
                $line .= ' (' . $request->academic_group . ')';
            }

            if ($request->message) {
                $line .= ': ' . $request->message;
            }

            return $line;
        })->filter()->values();

        return $lines->isNotEmpty() ? $lines->implode("\n") : null;
    }

    private function mapAcademicLevel(string $classLevel): string
    {
        return match ($classLevel) {
            'nursery', 'kg', '1', '2', '3', '4', '5' => 'primary',
            '6', '7', '8', '9', '10' => 'high_school',
            default => 'college',
        };
    }
}
