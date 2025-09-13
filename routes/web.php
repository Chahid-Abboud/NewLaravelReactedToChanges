<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Auth\RegisterWizardController;

Route::get('/', fn () => Inertia::render('Landing'))->name('landing');

Route::get('/home', fn () => Inertia::render('Home'))
    ->middleware(['auth'])
    ->name('home');

Route::middleware('guest')->group(function () {
    Route::get('/onboarding', [RegisterWizardController::class, 'create'])->name('onboarding.start');
    Route::post('/onboarding', [RegisterWizardController::class, 'store'])->name('onboarding.store');
});

require __DIR__.'/auth.php'; // Breeze (keeps GET/POST /register)
