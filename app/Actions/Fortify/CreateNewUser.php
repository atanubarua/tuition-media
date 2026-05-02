<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    public function create(array $input): User
    {
        $role = $input['role'] ?? User::ROLE_GUARDIAN;

        Validator::make($input, [
            ...$this->profileRules(),
            'role' => ['required', Rule::in([User::ROLE_GUARDIAN, User::ROLE_TUTOR])],
            'gender' => [$role === User::ROLE_TUTOR ? 'required' : 'nullable', Rule::in(['male', 'female'])],
            'password' => $this->passwordRules(),
        ])->validate();

        return User::create([
            'name' => $input['name'],
            'phone' => $input['phone'],
            'email' => $input['email'],
            'role' => $role,
            'gender' => $role === User::ROLE_TUTOR ? $input['gender'] : null,
            'password' => $input['password'],
        ]);
    }
}
