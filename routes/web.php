<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Inertia\Inertia;

use App\Http\Controllers\Auth\RegisterWizardController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\WaterIntakeController;
use App\Http\Controllers\PlacesController;
use App\Http\Controllers\Settings\ProfileController;

/*
|--------------------------------------------------------------------------
| Landing
|--------------------------------------------------------------------------
| GET /                → Public landing page (hero + “Start Your Journey”)
*/
Route::get('/', function () {
    return Inertia::render('Landing');
})->name('landing');

/*
|--------------------------------------------------------------------------
| Home (personalized dashboard)
|--------------------------------------------------------------------------
| GET /home            → Signed-in or guest home; props filled by HomeController
*/
Route::get('/home', [HomeController::class, 'index'])->name('home');

/*
|--------------------------------------------------------------------------
| Guest session (start/leave)
|--------------------------------------------------------------------------
| POST /guest/start    → Start guest browsing session, redirect to /home
| POST /guest/leave    → End session + logout, redirect to / (landing)
*/
Route::post('/guest/start', function (Request $request) {
    session([
        'guest'            => true,
        'guest_started_at' => now()->timestamp,
    ]);

    return redirect()->route('home');
})->name('guest.start');

Route::post('/guest/leave', function () {
    Auth::logout();
    session()->invalidate();
    session()->regenerateToken();

    return redirect()->route('landing');
})->name('guest.leave');

/*
|--------------------------------------------------------------------------
| Registration (wizard)
|--------------------------------------------------------------------------
| GET  /register       → Show multi-step wizard
| POST /register       → Submit wizard
*/
Route::middleware('guest')->group(function () {
    Route::get('/register', [RegisterWizardController::class, 'create'])->name('register.start');
    Route::post('/register', [RegisterWizardController::class, 'store'])->name('register.store');
});

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
| GET  /login          → Show login
| POST /login          → Perform login
| POST /logout         → Logout (auth only)
*/
Route::get('/login', [AuthenticatedSessionController::class, 'create'])
    ->middleware('guest')
    ->name('login');

Route::post('/login', [AuthenticatedSessionController::class, 'store'])
    ->middleware('guest');

Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])
    ->middleware('auth')
    ->name('logout');

/*
|--------------------------------------------------------------------------
| App pages (Inertia)
|--------------------------------------------------------------------------
| GET  /explore        → Public explore page
| GET  /meals          → Meals index (auth)
| GET  /meals/new      → Quick-add meal (auth)
| GET  /workouts       → Workouts index (auth)
| GET  /workouts/new   → Quick-add workout (auth)
*/
Route::get('/explore', fn () => Inertia::render('Explore'))->name('explore');

Route::middleware('auth')->group(function () {
    Route::get('/meals', fn () => Inertia::render('Meals/Index'))->name('meals.index');
    Route::get('/meals/new', fn () => Inertia::render('Meals/New'))->name('meals.new');
    Route::get('/workouts', fn () => Inertia::render('Workouts/Index'))->name('workouts.index');
    Route::get('/workouts/new', fn () => Inertia::render('Workouts/New'))->name('workouts.new');
});

/*
|--------------------------------------------------------------------------
| Maps / Places
|--------------------------------------------------------------------------
| GET  /nearby         → OSM/Mapbox nearby map page
| GET  /google-nearby  → Google Maps demo page
| GET  /api/places     → Backend endpoint for POIs (throttled)
*/
Route::get('/nearby', fn () => Inertia::render('NearbyMap'))->name('nearby');
Route::get('/google-nearby', fn () => Inertia::render('GoogleNearby'))->name('google.nearby');

Route::get('/api/places', [PlacesController::class, 'index'])
    ->middleware('throttle:60,1')
    ->name('api.places');

/*
|--------------------------------------------------------------------------
| Water intake (daily totals)
|--------------------------------------------------------------------------
| POST /water          → Increment today’s ml (auth only)
*/
Route::middleware('auth')->group(function () {
    Route::post('/water', [WaterIntakeController::class, 'store'])->name('water.store');
});

/*
|--------------------------------------------------------------------------
| Profile (Settings)
|--------------------------------------------------------------------------
| GET  /profile        → ProfileController@show (auth + verified)
*/
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/profile', [ProfileController::class, 'show'])->name('profile.show');
});
