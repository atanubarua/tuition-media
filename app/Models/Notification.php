<?php

namespace App\Models;

use App\Jobs\SendWebPushNotification;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    protected $fillable = ['user_id', 'type', 'title', 'message', 'link', 'read_at'];

    protected function casts(): array
    {
        return ['read_at' => 'datetime'];
    }

    protected static function booted(): void
    {
        // Fan emergency-typed notifications out to browser push. The config map
        // is the single source of truth for which type/recipient-role pairs are
        // "emergency"; everything else stays in-app only.
        static::created(function (Notification $notification): void {
            $allowedRoles = config('webpush.emergency')[$notification->type] ?? null;

            if ($allowedRoles === null) {
                return;
            }

            $recipient = $notification->user;

            if (! $recipient || ! in_array($recipient->role, $allowedRoles, true)) {
                return;
            }

            SendWebPushNotification::dispatch($notification->user_id, [
                'title' => $notification->title,
                'body' => $notification->message,
                'url' => $notification->link ?: '/',
                'tag' => $notification->type.'-'.$notification->id,
            ]);
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
