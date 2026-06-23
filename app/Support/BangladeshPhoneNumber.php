<?php

namespace App\Support;

class BangladeshPhoneNumber
{
    public static function normalize(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $sanitized = preg_replace('/[^\d+]/', '', trim($value));

        if ($sanitized === null || $sanitized === '') {
            return null;
        }

        if (str_starts_with($sanitized, '+')) {
            if (! str_starts_with($sanitized, '+88')) {
                return null;
            }

            $sanitized = substr($sanitized, 1);
        }

        if (str_starts_with($sanitized, '88')) {
            $sanitized = substr($sanitized, 2);
        }

        if (! preg_match('/^01\d{9}$/', $sanitized)) {
            return null;
        }

        return '+88'.$sanitized;
    }

    /**
     * @return array<int, string>
     */
    public static function variants(?string $value): array
    {
        $normalized = self::normalize($value);

        if ($normalized === null) {
            return [];
        }

        $local = substr($normalized, 3);

        return array_values(array_unique([
            $normalized,
            substr($normalized, 1),
            $local,
        ]));
    }
}
