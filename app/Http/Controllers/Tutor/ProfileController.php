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

        return Inertia::render('tutor/profile/edit', [
            ...$this->formProps(),
            'profile' => $profile ? [
                ...$profile->toArray(),
                'subject_ids' => $profile->subjects->pluck('id')->values(),
                'preferred_location_ids' => $profile->preferredLocations->pluck('id')->values(),
            ] : null,
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
            'teachable_levels' => ['required', 'array', 'min:1'],
            'teachable_levels.*' => ['in:primary,high_school,college,honors'],
            'teachable_mediums' => ['required', 'array', 'min:1'],
            'teachable_mediums.*' => ['in:bangla,english,madrasha,other'],
            'subject_ids' => ['required', 'array', 'min:1'],
            'subject_ids.*' => ['integer', 'exists:subjects,id'],
            'preferred_location_ids' => ['required', 'array', 'min:1'],
            'preferred_location_ids.*' => ['integer', 'exists:subdistricts,id'],
            'experience_months' => ['required', 'integer', 'min:1', 'max:600'],
            'bio' => ['nullable', 'string', 'max:1000'],
        ]);

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
