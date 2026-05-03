<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;
use App\Models\TuitionApplication;
use Illuminate\Support\Str;

class TuitionPost extends Model
{
    protected $fillable = [
        'tuition_code',
        'guardian_id',
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
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'published_at' => 'datetime',
            'preferred_time_slots' => 'array',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (TuitionPost $post): void {
            if (! empty($post->tuition_code)) {
                return;
            }

            do {
                $code = 'TID' . strtoupper(Str::random(8));
            } while (self::query()->where('tuition_code', $code)->exists());

            $post->tuition_code = $code;
        });
    }

    public function guardian(): BelongsTo
    {
        return $this->belongsTo(User::class, 'guardian_id');
    }

    public function applications(): HasMany
    {
        return $this->hasMany(TuitionApplication::class);
    }

    public function students(): HasMany
    {
        return $this->hasMany(TuitionPostStudent::class);
    }

    public function preferredUniversities(): BelongsToMany
    {
        return $this->belongsToMany(University::class, 'tuition_post_preferred_university');
    }
}
