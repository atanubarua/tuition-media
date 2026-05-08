<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GuardianController extends Controller
{
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
            ->get()
            ->map(fn (User $guardian) => [
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
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:20', 'unique:users,phone'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
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

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email,'.$guardian->id],
            'phone' => ['nullable', 'string', 'max:20', 'unique:users,phone,'.$guardian->id],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
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
