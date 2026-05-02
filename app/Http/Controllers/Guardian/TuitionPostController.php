<?php

namespace App\Http\Controllers\Guardian;

use App\Http\Controllers\Controller;
use App\Models\Subject;
use App\Models\TuitionPost;
use App\Models\University;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class TuitionPostController extends Controller
{
    public function index(Request $request): Response
    {
        $this->ensureGuardian($request);

        $posts = TuitionPost::query()
            ->where('guardian_id', $request->user()->id)
            ->withCount(['students', 'applications'])
            ->latest()
            ->get();

        return Inertia::render('guardian/tuition-posts/index', [
            'posts' => $posts,
        ]);
    }

    public function create(Request $request): Response
    {
        $this->ensureGuardian($request);

        return Inertia::render('guardian/tuition-posts/form', $this->formProps());
    }

    public function store(Request $request): RedirectResponse
    {
        $this->ensureGuardian($request);
        $validated = $this->validatePayload($request);

        DB::transaction(function () use ($request, $validated): void {
            $post = TuitionPost::create([
                'guardian_id' => $request->user()->id,
                ...$this->extractPostData($validated),
                'published_at' => $validated['status'] === 'published' ? now() : null,
            ]);

            $this->syncStudents($post, $validated['students']);
            $post->preferredUniversities()->sync($validated['preferred_university_ids'] ?? []);
        });

        return to_route('guardian.tuition-posts.index')->with('toast', [
            'type' => 'success',
            'message' => 'Tuition post created successfully.',
        ]);
    }

    public function edit(Request $request, TuitionPost $tuitionPost): Response
    {
        $this->ensureOwner($request, $tuitionPost);

        $tuitionPost->load(['students.subjects:id,name', 'preferredUniversities:id,name']);

        return Inertia::render('guardian/tuition-posts/form', [
            ...$this->formProps(),
            'post' => [
                ...$tuitionPost->toArray(),
                'preferred_university_ids' => $tuitionPost->preferredUniversities->pluck('id')->values(),
                'students' => $tuitionPost->students->map(fn ($student) => [
                    ...$student->toArray(),
                    'subject_ids' => $student->subjects->pluck('id')->values(),
                ]),
            ],
        ]);
    }

    public function update(Request $request, TuitionPost $tuitionPost): RedirectResponse
    {
        $this->ensureOwner($request, $tuitionPost);
        $validated = $this->validatePayload($request);

        DB::transaction(function () use ($tuitionPost, $validated): void {
            $tuitionPost->update([
                ...$this->extractPostData($validated),
                'published_at' => $validated['status'] === 'published'
                    ? ($tuitionPost->published_at ?? now())
                    : null,
            ]);

            $tuitionPost->students()->delete();
            $this->syncStudents($tuitionPost, $validated['students']);
            $tuitionPost->preferredUniversities()->sync($validated['preferred_university_ids'] ?? []);
        });

        return to_route('guardian.tuition-posts.index')->with('toast', [
            'type' => 'success',
            'message' => 'Tuition post updated successfully.',
        ]);
    }

    public function destroy(Request $request, TuitionPost $tuitionPost): RedirectResponse
    {
        $this->ensureOwner($request, $tuitionPost);
        $tuitionPost->delete();

        return to_route('guardian.tuition-posts.index')->with('toast', [
            'type' => 'success',
            'message' => 'Tuition post deleted successfully.',
        ]);
    }

    private function formProps(): array
    {
        return [
            'divisions' => DB::table('divisions')->select('id', 'name')->orderBy('name')->get(),
            'districts' => DB::table('districts')->select('id', 'division_id', 'name')->orderBy('name')->get(),
            'subdistricts' => DB::table('subdistricts')->select('id', 'district_id', 'name', 'type')->orderBy('name')->get(),
            'universities' => University::query()->where('is_active', true)->select('id', 'name', 'type')->orderBy('name')->get(),
            'subjects' => Subject::query()->where('is_active', true)->select('id', 'name', 'group_name')->orderBy('name')->get(),
            'academicLevels' => ['primary', 'high_school', 'college', 'honors'],
            'mediums' => ['bangla', 'english', 'madrasha', 'other'],
            'statuses' => ['draft', 'published'],
        ];
    }

    private function validatePayload(Request $request): array
    {
        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'division_id' => ['required', 'exists:divisions,id'],
            'district_id' => ['required', 'exists:districts,id'],
            'subdistrict_id' => ['required', 'exists:subdistricts,id'],
            'address_line' => ['nullable', 'string', 'max:255'],
            'salary_type' => ['required', 'in:fixed,range,negotiable'],
            'salary_min' => ['nullable', 'integer', 'min:0'],
            'salary_max' => ['nullable', 'integer', 'min:0'],
            'days_per_week' => ['required', 'integer', 'between:1,7'],
            'preferred_time_slots' => ['nullable', 'array'],
            'preferred_time_slots.*' => ['string'],
            'duration_months' => ['nullable', 'integer', 'between:1,60'],
            'tutor_gender_preference' => ['required', 'in:male,female,any'],
            'required_experience_months' => ['nullable', 'integer', 'min:0', 'max:600'],
            'special_requirements' => ['nullable', 'string'],
            'status' => ['required', 'in:draft,published'],
            'preferred_university_ids' => ['array'],
            'preferred_university_ids.*' => ['integer', 'exists:universities,id'],
            'students' => ['required', 'array', 'min:1'],
            'students.*.student_name' => ['required', 'string', 'max:255'],
            'students.*.academic_level' => ['required', 'in:primary,high_school,college,honors'],
            'students.*.class_level' => ['nullable', 'integer', 'between:0,12'],
            'students.*.honors_subject' => ['nullable', 'string', 'max:255'],
            'students.*.medium' => ['required', 'in:bangla,english,madrasha,other'],
            'students.*.subject_ids' => ['required', 'array', 'min:1'],
            'students.*.subject_ids.*' => ['integer', 'exists:subjects,id'],
        ]);

        if ($validated['salary_type'] === 'fixed' && empty($validated['salary_min'])) {
            throw ValidationException::withMessages([
                'salary_min' => 'Fixed salary requires a salary minimum.',
            ]);
        }

        if ($validated['salary_type'] === 'range') {
            if (empty($validated['salary_min']) || empty($validated['salary_max'])) {
                throw ValidationException::withMessages([
                    'salary_min' => 'Salary range requires both minimum and maximum.',
                ]);
            }

            if ($validated['salary_max'] < $validated['salary_min']) {
                throw ValidationException::withMessages([
                    'salary_max' => 'Maximum salary must be greater than or equal to minimum salary.',
                ]);
            }
        }

        foreach ($validated['students'] as $index => $student) {
            if ($student['academic_level'] === 'honors' && empty($student['honors_subject'])) {
                throw ValidationException::withMessages([
                    "students.{$index}.honors_subject" => 'Honors subject is required for honors level.',
                ]);
            }

            if ($student['academic_level'] !== 'honors' && ! isset($student['class_level'])) {
                throw ValidationException::withMessages([
                    "students.{$index}.class_level" => 'Class level is required for this academic level.',
                ]);
            }
        }

        return $validated;
    }

    private function extractPostData(array $validated): array
    {
        return collect($validated)->only([
            'title',
            'division_id',
            'district_id',
            'subdistrict_id',
            'address_line',
            'salary_type',
            'salary_min',
            'salary_max',
            'days_per_week',
            'preferred_time_slots',
            'duration_months',
            'tutor_gender_preference',
            'required_experience_months',
            'special_requirements',
            'status',
        ])->all();
    }

    private function syncStudents(TuitionPost $post, array $students): void
    {
        foreach ($students as $studentData) {
            $student = $post->students()->create([
                'student_name' => $studentData['student_name'],
                'academic_level' => $studentData['academic_level'],
                'class_level' => $studentData['class_level'] ?? null,
                'honors_subject' => $studentData['honors_subject'] ?? null,
                'medium' => $studentData['medium'],
            ]);

            $student->subjects()->sync($studentData['subject_ids']);
        }
    }

    private function ensureGuardian(Request $request): void
    {
        abort_unless($request->user()?->role === 'guardian', 403);
    }

    private function ensureOwner(Request $request, TuitionPost $post): void
    {
        $this->ensureGuardian($request);
        abort_unless($post->guardian_id === $request->user()->id, 403);
    }
}
