<?php

use App\Http\Controllers\Guardian\TuitionPostController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
    Route::resource('guardian/tuition-posts', TuitionPostController::class)
        ->except(['show'])
        ->names('guardian.tuition-posts');
});

require __DIR__.'/settings.php';
