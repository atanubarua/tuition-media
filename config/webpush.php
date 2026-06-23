<?php

return [
    /*
    |--------------------------------------------------------------------------
    | VAPID keys
    |--------------------------------------------------------------------------
    |
    | Generate a key pair with `php artisan webpush:vapid` and paste the values
    | into your .env file. The public key is exposed to the browser; the private
    | key must stay secret. The subject is a mailto: or https: URL identifying
    | the application server to the push services.
    |
    */
    'public_key' => env('VAPID_PUBLIC_KEY'),
    'private_key' => env('VAPID_PRIVATE_KEY'),
    'subject' => env('VAPID_SUBJECT', env('APP_URL', 'http://localhost')),

    /*
    |--------------------------------------------------------------------------
    | Emergency notification map
    |--------------------------------------------------------------------------
    |
    | The single source of truth for which in-app notification types are
    | "emergency" and therefore also delivered as a browser push. The map is
    | keyed by Notification::type and lists the recipient roles allowed to be
    | pushed. A notification is pushed only when its type is listed here AND the
    | recipient user's role is in the corresponding list. All other in-app
    | notifications stay in-app only.
    |
    */
    'emergency' => [
        'tutor_request' => ['admin'],
        'shortlisted' => ['tutor'],
        'new_tuition_post' => ['admin'],
        'hired' => ['tutor'],
        'new_application' => ['guardian'],
        'tutor_request_assigned' => ['guardian'],
    ],
];
