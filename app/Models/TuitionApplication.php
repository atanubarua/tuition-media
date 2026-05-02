<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TuitionApplication extends Model
{
    protected $fillable = [
        'tuition_post_id',
        'tutor_id',
        'cover_note',
        'expected_salary',
        'status',
    ];

    public function tuitionPost(): BelongsTo
    {
        return $this->belongsTo(TuitionPost::class);
    }

    public function tutor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'tutor_id');
    }
}
