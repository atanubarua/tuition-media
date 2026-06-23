<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Model;

class TuitionPostStudent extends Model
{
    protected $fillable = [
        'tuition_post_id',
        'student_name',
        'academic_level',
        'class_level',
        'academic_group',
        'honors_subject',
        'medium',
    ];

    public function tuitionPost(): BelongsTo
    {
        return $this->belongsTo(TuitionPost::class);
    }

    public function subjects(): BelongsToMany
    {
        return $this->belongsToMany(Subject::class, 'tuition_post_student_subject');
    }
}
