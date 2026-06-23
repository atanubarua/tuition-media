<?php

namespace App\Concerns;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rules\Password;

trait PasswordValidationRules
{
    /**
     * Get the validation rules used to validate passwords.
     *
     * @return array<int, ValidationRule|array<mixed>|string>
     */
    protected function passwordRules(?string $role = null): array
    {
        return ['required', 'string', $this->passwordRuleForRole($role), 'confirmed'];
    }

    /**
     * Get the validation rules used to validate the current password.
     *
     * @return array<int, ValidationRule|array<mixed>|string>
     */
    protected function currentPasswordRules(): array
    {
        return ['required', 'string', 'current_password'];
    }

    /**
     * Get the password rule for a given role.
     */
    protected function passwordRuleForRole(?string $role = null): Password
    {
        return match ($role) {
            User::ROLE_GUARDIAN, User::ROLE_TUTOR => Password::min(4),
            default => Password::default(),
        };
    }
}
