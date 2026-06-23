<?php

namespace App\Http\Controllers\Tutor;

use App\Http\Controllers\Controller;
use App\Models\Subject;
use App\Models\TutorProfile;
use App\Models\University;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function edit(Request $request): Response
    {
        $this->ensureTutor($request);

        $profile = TutorProfile::query()
            ->where('user_id', $request->user()->id)
            ->with(['subjects:id,name', 'preferredLocations:id,district_id,name,type'])
            ->first();

        $legacyClasses = [
            'primary' => ['nursery', 'kg', '1', '2', '3', '4', '5'],
            'high_school' => ['6', '7', '8', '9', '10'],
            'college' => ['11', '12'],
            'honors' => [],
        ];

        $profileData = $profile ? [
            ...$profile->toArray(),
            'teachable_classes' => !empty($profile->teachable_classes)
                ? $profile->teachable_classes
                : collect($profile->teachable_levels ?? [])
                    ->flatMap(fn ($level) => $legacyClasses[$level] ?? [])
                    ->unique()
                    ->values()
                    ->all(),
            'teachable_groups' => $profile->teachable_groups ?? [],
            'subject_ids' => $profile->subjects->pluck('id')->values(),
            'preferred_location_ids' => $profile->preferredLocations->pluck('id')->values(),
        ] : null;

        return Inertia::render('tutor/profile/edit', [
            ...$this->formProps(),
            'profile' => $profileData,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $this->ensureTutor($request);

        $validated = $request->validate([
            'occupation' => ['required', 'in:student,employed,other'],
            'job_title' => ['nullable', 'required_if:occupation,employed', 'string', 'max:100'],
            'job_organization' => ['nullable', 'string', 'max:150'],
            'university_id' => ['required', 'exists:universities,id'],
            'department' => ['required', 'string', 'max:100'],
            'academic_year' => ['required', 'integer', 'between:1,5'],
            'intake_year' => ['required', 'integer', 'min:1990', 'max:' . now()->year],
            'teachable_classes' => ['required', 'array', 'min:1'],
            'teachable_classes.*' => ['in:nursery,kg,1,2,3,4,5,6,7,8,9,10,11,12'],
            'teachable_groups' => ['nullable', 'array'],
            'teachable_groups.*' => ['in:science,commerce,arts'],
            'teachable_mediums' => ['required', 'array', 'min:1'],
            'teachable_mediums.*' => ['in:bangla,english,madrasha,other'],
            'subject_ids' => ['required', 'array', 'min:1'],
            'subject_ids.*' => ['integer', 'exists:subjects,id'],
            'preferred_location_ids' => ['required', 'array', 'min:1'],
            'preferred_location_ids.*' => ['integer', 'exists:subdistricts,id'],
            'experience_months' => ['nullable', 'integer', 'min:0', 'max:600'],
            'bio' => ['nullable', 'string', 'max:1000'],
        ], [], [
            'university_id' => 'university',
        ]);

        if (
            array_intersect($validated['teachable_classes'], ['9', '10', '11', '12']) !== []
            && empty($validated['teachable_groups'] ?? [])
        ) {
            return back()
                ->withErrors(['teachable_groups' => 'Select at least one group for classes 9-12.'])
                ->withInput();
        }

        $validated['experience_months'] = $validated['experience_months'] ?? 0;

        DB::transaction(function () use ($request, $validated): void {
            $profile = TutorProfile::updateOrCreate(
                ['user_id' => $request->user()->id],
                collect($validated)->except(['subject_ids', 'preferred_location_ids'])->all(),
            );

            $profile->subjects()->sync($validated['subject_ids']);
            $profile->preferredLocations()->sync($validated['preferred_location_ids']);
        });

        return back()->with('toast', [
            'type' => 'success',
            'message' => 'Profile updated successfully.',
        ]);
    }

    private function formProps(): array
    {
        return [
            'universities' => University::query()->where('is_active', true)->select('id', 'name', 'type')->orderBy('name')->get(),
            'subjects' => Subject::query()->where('is_active', true)->select('id', 'name', 'group_name')->orderBy('name')->get(),
            'districts' => DB::table('districts')->select('id', 'division_id', 'name')->orderBy('name')->get(),
            'subdistricts' => DB::table('subdistricts')->select('id', 'district_id', 'name', 'type')->orderBy('name')->get(),
        ];
    }

    private function ensureTutor(Request $request): void
    {
        abort_unless($request->user()?->role === 'tutor', 403);
    }
}
