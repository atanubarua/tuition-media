<?php

namespace App\Jobs;

use App\Models\PushSubscription;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;

class SendWebPushNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * @param  array{title: string, body: string, url: ?string, tag: ?string}  $payload
     */
    public function __construct(
        public int $userId,
        public array $payload,
    ) {}

    public function handle(): void
    {
        $publicKey = config('webpush.public_key');
        $privateKey = config('webpush.private_key');

        if (! $publicKey || ! $privateKey) {
            Log::warning('Web push skipped: VAPID keys are not configured.');

            return;
        }

        $subscriptions = PushSubscription::where('user_id', $this->userId)->get();

        if ($subscriptions->isEmpty()) {
            return;
        }

        $webPush = new WebPush([
            'VAPID' => [
                'subject' => config('webpush.subject'),
                'publicKey' => $publicKey,
                'privateKey' => $privateKey,
            ],
        ]);

        $message = json_encode([
            'title' => $this->payload['title'] ?? config('app.name'),
            'body' => $this->payload['body'] ?? '',
            'url' => $this->payload['url'] ?? '/',
            'tag' => $this->payload['tag'] ?? null,
        ]);

        $byEndpoint = [];

        foreach ($subscriptions as $subscription) {
            $byEndpoint[$subscription->endpoint] = $subscription;

            $webPush->queueNotification(
                Subscription::create([
                    'endpoint' => $subscription->endpoint,
                    'publicKey' => $subscription->public_key,
                    'authToken' => $subscription->auth_token,
                    'contentEncoding' => $subscription->content_encoding ?: 'aesgcm',
                ]),
                $message,
            );
        }

        foreach ($webPush->flush() as $report) {
            $endpoint = $report->getEndpoint();

            if (! $report->isSuccess() && $report->isSubscriptionExpired()) {
                // Endpoint is gone (404/410) — prune the dead subscription.
                $byEndpoint[$endpoint]?->delete();
            }
        }
    }
}
