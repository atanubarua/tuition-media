<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TutorRequest extends Model
{
    protected $fillable = [
        'guardian_id',
        'tutor_id',
        'request_group_id',
        'tuition_post_id',
        'assigned_tutor_id',
        'division_id',
        'district_id',
        'subdistrict_id',
        'class_level',
        'academic_group',
        'message',
        'status',
        'contacted_at',
        'assigned_at',
        'closed_at',
        'admin_note',
    ];

    public function guardian(): BelongsTo
    {
        return $this->belongsTo(User::class, 'guardian_id');
    }

    public function tutor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'tutor_id');
    }
}
