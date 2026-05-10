<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TuitionApplication extends Model
{
    protected $fillable = [
        'tuition_post_id',
        'tutor_id',
        'cover_note',
        'expected_salary',
        'status',
        'admin_note',
        'hired_by',
        'hired_at',
        'commission_type',
        'commission_value',
        'commission_amount',
        'commission_received_amount',
        'commission_payment_status',
        'commission_paid_at',
        'commission_due_date',
    ];

    protected function casts(): array
    {
        return [
            'hired_at' => 'datetime',
            'commission_value' => 'decimal:2',
            'commission_paid_at' => 'datetime',
            'commission_due_date' => 'date',
        ];
    }

    public function tuitionPost(): BelongsTo
    {
        return $this->belongsTo(TuitionPost::class);
    }

    public function tutor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'tutor_id');
    }

    public function commissionPayments(): HasMany
    {
        return $this->hasMany(CommissionPayment::class, 'tuition_application_id');
    }
}
