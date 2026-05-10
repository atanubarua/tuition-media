<?php

namespace App\Providers;

use App\Models\Notification;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();

        Inertia::share('unread_notifications_count', function () {
            $user = auth()->user();
            if (! $user) return 0;
            return Notification::where('user_id', $user->id)->whereNull('read_at')->count();
        });

        Inertia::share('locale', function () {
            return session('locale', config('app.locale'));
        });

        Inertia::share('translations', function () {
            $locale = session('locale', config('app.locale'));
            return trans($locale);
        });

        Inertia::share('latest_notifications', function () {
            $user = auth()->user();

            if (! $user) {
                return [];
            }

            return Notification::where('user_id', $user->id)
                ->latest()
                ->limit(5)
                ->get(['id', 'title', 'message', 'link', 'read_at', 'created_at']);
        });
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
