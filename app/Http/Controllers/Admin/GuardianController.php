<?php

namespace App\Http\Controllers\Admin;

use App\Concerns\PasswordValidationRules;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\BangladeshPhoneNumber;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GuardianController extends Controller
{
    use PasswordValidationRules;

    public function index(Request $request): Response
    {
        $name = $request->string('name')->toString();
        $email = $request->string('email')->toString();
        $phone = $request->string('phone')->toString();

        $guardians = User::query()
            ->where('role', User::ROLE_GUARDIAN)
            ->withCount('tuitionPosts')
            ->when($name !== '', fn ($query) => $query->where('name', 'like', "%{$name}%"))
            ->when($email !== '', fn ($query) => $query->where('email', 'like', "%{$email}%"))
            ->when($phone !== '', fn ($query) => $query->where('phone', 'like', "%{$phone}%"))
            ->latest()
            ->paginate(20)
            ->withQueryString()
            ->through(fn (User $guardian) => [
                'id' => $guardian->id,
                'name' => $guardian->name,
                'email' => $guardian->email,
                'phone' => $guardian->phone,
                'tuition_posts_count' => $guardian->tuition_posts_count,
                'created_at' => $guardian->created_at,
            ]);

        return Inertia::render('admin/guardians/index', [
            'guardians' => $guardians,
            'filters' => [
                'name' => $name,
                'email' => $email,
                'phone' => $phone,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $phone = $request->string('phone')->toString();
        $normalizedPhone = $request->filled('phone') ? BangladeshPhoneNumber::normalize($phone) : null;

        $request->merge([
            'phone' => $normalizedPhone ?? ($request->filled('phone') ? $phone : null),
        ]);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'phone' => [
                'nullable',
                'string',
                'max:15',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if ($value !== null && BangladeshPhoneNumber::normalize(is_string($value) ? $value : null) === null) {
                        $fail('Please enter a valid Bangladesh mobile number.');
                    }
                },
                'unique:users,phone',
            ],
            'password' => $this->passwordRules(User::ROLE_GUARDIAN),
        ]);

        User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'password' => $validated['password'],
            'role' => User::ROLE_GUARDIAN,
        ]);

        return to_route('admin.guardians.index')->with('toast', [
            'type' => 'success',
            'message' => 'Guardian created successfully.',
        ]);
    }

    public function update(Request $request, User $guardian): RedirectResponse
    {
        abort_unless($guardian->role === User::ROLE_GUARDIAN, 404);

        $phone = $request->string('phone')->toString();
        $normalizedPhone = $request->filled('phone') ? BangladeshPhoneNumber::normalize($phone) : null;

        $request->merge([
            'phone' => $normalizedPhone ?? ($request->filled('phone') ? $phone : null),
        ]);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email,'.$guardian->id],
            'phone' => [
                'nullable',
                'string',
                'max:15',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if ($value !== null && BangladeshPhoneNumber::normalize(is_string($value) ? $value : null) === null) {
                        $fail('Please enter a valid Bangladesh mobile number.');
                    }
                },
                'unique:users,phone,'.$guardian->id,
            ],
            'password' => ['nullable', 'string', $this->passwordRuleForRole(User::ROLE_GUARDIAN), 'confirmed'],
        ]);

        $guardian->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            ...(! empty($validated['password']) ? ['password' => $validated['password']] : []),
        ]);

        return to_route('admin.guardians.index')->with('toast', [
            'type' => 'success',
            'message' => 'Guardian updated successfully.',
        ]);
    }

    public function destroy(User $guardian): RedirectResponse
    {
        abort_unless($guardian->role === User::ROLE_GUARDIAN, 404);
        $guardian->delete();

        return to_route('admin.guardians.index')->with('toast', [
            'type' => 'success',
            'message' => 'Guardian deleted successfully.',
        ]);
    }
}
