<?php

namespace App\Http\Controllers\Guardian;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\TutorRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Pagination\Paginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class TutorRequestController extends Controller
{
    public function index(Request $request): Response
    {
        $status = trim($request->string('status')->toString());
        $tutor  = trim($request->string('tutor')->toString());

        $rows = TutorRequest::query()
            ->with(['tutor:id,name,gender'])
            ->select([
                'id', 'request_group_id', 'guardian_id', 'tutor_id',
                'division_id', 'district_id', 'subdistrict_id',
                'class_level', 'academic_group', 'message', 'status',
                'tuition_post_id', 'assigned_at', 'created_at',
            ])
            ->where('guardian_id', $request->user()->id)
            ->when($status !== '', fn ($q) => $q->where('status', $status))
            ->when($tutor !== '', fn ($q) => $q->whereHas('tutor', fn ($u) =>
                $u->where('name', 'like', "%{$tutor}%")
            ))
            ->latest()
            ->get();

        $grouped = $rows
            ->groupBy(fn (TutorRequest $r) => $r->request_group_id ?: "legacy-{$r->id}")
            ->map(function ($group) {
                /** @var TutorRequest $first */
                $first = $group->first();

                return [
                    'id'               => $first->id,
                    'request_group_id' => $first->request_group_id,
                    'status'           => $first->status === 'reviewed' ? 'contacted' : $first->status,
                    'location'         => $this->resolveLocation($first->division_id, $first->district_id, $first->subdistrict_id),
                    'created_at'       => $first->created_at,
                    'tuition_post_id'  => $first->tuition_post_id,
                    'assigned_at'      => $first->assigned_at,
                    'students'         => $group->values()->map(fn (TutorRequest $r) => [
                        'class_level'    => $r->class_level,
                        'academic_group' => $r->academic_group,
                    ])->all(),
                    'tutor' => $first->tutor ? [
                        'id'     => $first->tutor->id,
                        'name'   => $first->tutor->name,
                        'gender' => $first->tutor->gender,
                    ] : null,
                ];
            })
            ->sortByDesc(fn (array $r) => $r['created_at'])
            ->values();

        $page    = Paginator::resolveCurrentPage();
        $perPage = 20;
        $items   = $grouped->forPage($page, $perPage)->values();
        $requests = new LengthAwarePaginator($items, $grouped->count(), $perPage, $page, [
            'path'  => Paginator::resolveCurrentPath(),
            'query' => $request->query(),
        ]);

        return Inertia::render('guardian/tutor-requests/index', [
            'requests' => $requests,
            'filters'  => ['status' => $status, 'tutor' => $tutor],
            'statuses' => ['pending', 'contacted', 'assigned', 'rejected'],
        ]);
    }

    private function resolveLocation(?int $divisionId, ?int $districtId, ?int $subdistrictId): ?string
    {
        if (! $divisionId && ! $districtId && ! $subdistrictId) {
            return null;
        }

        $division    = $divisionId    ? DB::table('divisions')->where('id', $divisionId)->value('name')       : null;
        $district    = $districtId    ? DB::table('districts')->where('id', $districtId)->value('name')       : null;
        $subdistrict = $subdistrictId ? DB::table('subdistricts')->where('id', $subdistrictId)->value('name') : null;

        return collect([$subdistrict, $district, $division])->filter()->implode(', ') ?: null;
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->role === User::ROLE_GUARDIAN, 403);

        $validated = $request->validate([
            'tutor_id'       => ['required', 'integer', 'exists:users,id'],
            'division_id'    => ['required', 'integer', 'exists:divisions,id'],
            'district_id'    => ['required', 'integer', 'exists:districts,id'],
            'subdistrict_id' => ['required', 'integer', 'exists:subdistricts,id'],
            'students'       => ['required', 'array', 'min:1', 'max:10'],
            'students.*.class_level'    => ['required', 'string', 'in:nursery,kg,1,2,3,4,5,6,7,8,9,10,11,12'],
            'students.*.academic_group' => ['nullable', 'string', 'in:science,commerce,arts'],
            'students.*.message'        => ['nullable', 'string', 'max:2000'],
        ], [
            'division_id.required'    => 'Division is required.',
            'division_id.exists'      => 'Please select a valid division.',
            'district_id.required'    => 'District is required.',
            'district_id.exists'      => 'Please select a valid district.',
            'subdistrict_id.required' => 'Area is required.',
            'subdistrict_id.exists'   => 'Please select a valid area.',
            'students.required'              => 'At least one student is required.',
            'students.*.class_level.required' => 'Class level is required for each student.',
            'students.*.class_level.in'      => 'Please select a valid class level.',
            'students.*.academic_group.in'   => 'Please select a valid academic group.',
            'students.*.message.max'         => 'Message must not exceed 2000 characters.',
        ]);

        foreach ($validated['students'] as $index => $student) {
            if (in_array($student['class_level'], ['9', '10', '11', '12']) && empty($student['academic_group'])) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    "students.{$index}.academic_group" => 'Academic group is required for class 9 to 12.',
                ]);
            }
        }

        $tutor = User::query()
            ->where('id', $validated['tutor_id'])
            ->where('role', User::ROLE_TUTOR)
            ->firstOrFail();

        $existing = TutorRequest::query()
            ->where('guardian_id', $request->user()->id)
            ->where('tutor_id', $tutor->id)
            ->whereIn('status', ['pending', 'reviewed'])
            ->latest()
            ->first();

        if ($existing) {
            return back()->with('toast', [
                'type'    => 'error',
                'message' => 'You already have an active request for this tutor.',
            ]);
        }

        $requestGroupId = (string) Str::uuid();

        foreach ($validated['students'] as $student) {
            TutorRequest::create([
                'guardian_id'    => $request->user()->id,
                'tutor_id'       => $tutor->id,
                'request_group_id' => $requestGroupId,
                'division_id'    => $validated['division_id'] ?? null,
                'district_id'    => $validated['district_id'] ?? null,
                'subdistrict_id' => $validated['subdistrict_id'] ?? null,
                'class_level'    => $student['class_level'] ?? null,
                'academic_group' => $student['academic_group'] ?? null,
                'message'        => $student['message'] ?? null,
                'status'         => 'pending',
            ]);
        }

        $adminIds = User::query()->where('role', User::ROLE_ADMIN)->pluck('id');

        foreach ($adminIds as $adminId) {
            Notification::create([
                'user_id' => $adminId,
                'type'    => 'tutor_request',
                'title'   => 'New tutor request submitted',
                'message' => 'A guardian requested tutor ' . $tutor->name . '.',
                'link'    => '/admin/tutor-requests',
            ]);
        }

        return back()->with('toast', [
            'type'    => 'success',
            'message' => 'Tutor request submitted for admin review.',
        ]);
    }
}
