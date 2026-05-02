<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class TutorProfile extends Model
{
    protected $fillable = [
        'user_id',
        'occupation',
        'job_title',
        'job_organization',
        'university_id',
        'department',
        'academic_year',
        'intake_year',
        'teachable_levels',
        'teachable_mediums',
        'experience_months',
        'bio',
        'profile_photo',
        'is_verified',
    ];

    protected function casts(): array
    {
        return [
            'teachable_levels' => 'array',
            'teachable_mediums' => 'array',
            'is_verified' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function university(): BelongsTo
    {
        return $this->belongsTo(University::class);
    }

    public function subjects(): BelongsToMany
    {
        return $this->belongsToMany(Subject::class, 'tutor_subjects');
    }

    public function preferredLocations(): BelongsToMany
    {
        return $this->belongsToMany(Subdistrict::class, 'tutor_preferred_locations', 'tutor_profile_id', 'subdistrict_id');
    }
}
