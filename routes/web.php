<?php

use App\Http\Controllers\Guardian\TuitionApplicationController as GuardianApplicationController;
use App\Http\Controllers\Admin\GuardianController as AdminGuardianController;
use App\Http\Controllers\Admin\CommissionController as AdminCommissionController;
use App\Http\Controllers\Admin\TuitionApplicationController as AdminTuitionApplicationController;
use App\Http\Controllers\Admin\TuitionPostController as AdminTuitionPostController;
use App\Http\Controllers\Admin\TutorController as AdminTutorController;
use App\Http\Controllers\Guardian\TuitionPostController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\TuitionPostShowController;
use App\Http\Controllers\FindTutorController;
use App\Http\Controllers\TuitionJobController;
use App\Http\Controllers\Tutor\ProfileController;
use App\Http\Controllers\Tutor\TuitionApplicationController;
use App\Http\Middleware\EnsureUserIsAdmin;
use App\Models\User;
use Illuminate\Support\Facades\Route;

// Bind 'tutor' route parameter to User model with role='tutor'
Route::bind('tutor', function ($value) {
    return User::where('id', $value)->where('role', 'tutor')->firstOrFail();
});

// Bind 'guardian' route parameter to User model with role='guardian'
Route::bind('guardian', function ($value) {
    return User::where('id', $value)->where('role', 'guardian')->firstOrFail();
});

Route::get('/', HomeController::class)->name('home');
Route::get('/find-tutors', [FindTutorController::class, 'index'])->name('find-tutors');
Route::get('/tuition-jobs', [TuitionJobController::class, 'index'])->name('tuition-jobs.index');
Route::get('/tuition-posts/{tuitionPost}', TuitionPostShowController::class)->name('tuition-posts.show');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');
    Route::get('admin/tuition-posts', [AdminTuitionPostController::class, 'index'])
        ->middleware(EnsureUserIsAdmin::class)
        ->name('admin.tuition-posts.index');
    Route::get('admin/tuition-posts/{tuitionPost}', [AdminTuitionPostController::class, 'show'])
        ->middleware(EnsureUserIsAdmin::class)
        ->name('admin.tuition-posts.show');
    Route::get('admin/applications', [AdminTuitionApplicationController::class, 'index'])
        ->middleware(EnsureUserIsAdmin::class)
        ->name('admin.applications.index');
    Route::patch('admin/applications/{application}/contact-status', [AdminTuitionApplicationController::class, 'updateContactStatus'])
        ->middleware(EnsureUserIsAdmin::class)
        ->name('admin.applications.contact-status');
    Route::patch('admin/applications/{application}/commission-payment-status', [AdminTuitionApplicationController::class, 'updateCommissionPaymentStatus'])
        ->middleware(EnsureUserIsAdmin::class)
        ->name('admin.applications.commission-payment-status');
    Route::patch('admin/applications/{application}/hire', [AdminTuitionApplicationController::class, 'hire'])
        ->middleware(EnsureUserIsAdmin::class)
        ->name('admin.applications.hire');
     Route::get('admin/commissions', [AdminCommissionController::class, 'index'])
         ->middleware(EnsureUserIsAdmin::class)
         ->name('admin.commissions.index');
     Route::patch('admin/commissions/{application}/payment', [AdminCommissionController::class, 'updatePayment'])
         ->middleware(EnsureUserIsAdmin::class)
         ->name('admin.commissions.payment');
     Route::get('admin/tutors', [AdminTutorController::class, 'index'])
         ->middleware(EnsureUserIsAdmin::class)
         ->name('admin.tutors.index');
     Route::get('admin/tutors/{tutor}', [AdminTutorController::class, 'show'])
         ->middleware(EnsureUserIsAdmin::class)
         ->name('admin.tutors.show');
     Route::get('admin/guardians', [AdminGuardianController::class, 'index'])
         ->middleware(EnsureUserIsAdmin::class)
         ->name('admin.guardians.index');
     Route::post('admin/guardians', [AdminGuardianController::class, 'store'])
         ->middleware(EnsureUserIsAdmin::class)
         ->name('admin.guardians.store');
     Route::put('admin/guardians/{guardian}', [AdminGuardianController::class, 'update'])
         ->middleware(EnsureUserIsAdmin::class)
         ->name('admin.guardians.update');
     Route::delete('admin/guardians/{guardian}', [AdminGuardianController::class, 'destroy'])
         ->middleware(EnsureUserIsAdmin::class)
         ->name('admin.guardians.destroy');

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
