<?php

use App\Http\Controllers\Guardian\TuitionApplicationController as GuardianApplicationController;
use App\Http\Controllers\Guardian\TuitionPostController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\TuitionPostShowController;
use App\Http\Controllers\Tutor\ProfileController;
use App\Http\Controllers\Tutor\TuitionApplicationController;
use Illuminate\Support\Facades\Route;

Route::get('/', HomeController::class)->name('home');
Route::get('/tuition-posts/{tuitionPost}', TuitionPostShowController::class)->name('tuition-posts.show');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
    Route::resource('guardian/tuition-posts', TuitionPostController::class)
        ->except(['show'])
        ->names('guardian.tuition-posts');

    Route::get('guardian/tuition-posts/{tuitionPost}/applications', [GuardianApplicationController::class, 'index'])->name('guardian.applications.index');
    Route::patch('guardian/tuition-posts/{tuitionPost}/applications/{application}', [GuardianApplicationController::class, 'updateStatus'])->name('guardian.applications.update');

    Route::get('tutor/profile/edit', [ProfileController::class, 'edit'])->name('tutor.profile.edit');
    Route::put('tutor/profile', [ProfileController::class, 'update'])->name('tutor.profile.update');

    Route::post('tuition-posts/{tuitionPost}/apply', [TuitionApplicationController::class, 'store'])->name('tuition-posts.apply');
    Route::get('tutor/applications', [TuitionApplicationController::class, 'index'])->name('tutor.applications.index');

    Route::get('notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('notifications/mark-read', [NotificationController::class, 'markRead'])->name('notifications.mark-read');
});

require __DIR__.'/settings.php';
