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
use App\Http\Controllers\TrackMealsController;
use App\Http\Controllers\FoodController;         // singular class name matches file
use App\Http\Controllers\MealEntryController;    // fixed filename / class name
use App\Http\Controllers\Workout\WorkoutPlanController;
use App\Http\Controllers\Workout\WorkoutLogController;

/*
|--------------------------------------------------------------------------
| Landing (public)
|--------------------------------------------------------------------------
*/
Route::get('/', function () {
    return Inertia::render('Landing');
})->name('landing');

/*
|--------------------------------------------------------------------------
| Home (dashboard)
|--------------------------------------------------------------------------
*/
Route::get('/home', [HomeController::class, 'index'])->name('home');

/*
|--------------------------------------------------------------------------
| Guest session (start/leave)
|--------------------------------------------------------------------------
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
| Registration (wizard) - guest only
|--------------------------------------------------------------------------
*/
Route::middleware('guest')->group(function () {
    Route::get('/register', [RegisterWizardController::class, 'create'])->name('register.start');
    Route::post('/register', [RegisterWizardController::class, 'store'])->name('register.store');
});

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
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
*/
Route::get('/explore', fn () => Inertia::render('Explore'))->name('explore');

Route::middleware('auth')->group(function () {
    Route::get('/meals', fn () => Inertia::render('Meals/Index'))->name('meals.index');
    Route::get('/meals/new', fn () => Inertia::render('Meals/New'))->name('meals.new');

    // ✅ FIX: remove non-existent Workouts/Index & Workouts/New.
    // Keep pretty URLs working by redirecting to the real pages that have data.
    Route::redirect('/workouts', '/workouts/log')->name('workouts.index');
    Route::redirect('/workouts/new', '/workouts/plan')->name('workouts.new');
});

/*
|--------------------------------------------------------------------------
| Maps / Places
|--------------------------------------------------------------------------
*/
Route::get('/nearby', fn () => Inertia::render('NearbyMap'))->name('nearby');
Route::get('/google-nearby', fn () => Inertia::render('GoogleNearby'))->name('google.nearby');

Route::get('/api/places', [PlacesController::class, 'index'])
    ->middleware('throttle:60,1')
    ->name('api.places');

/*
|--------------------------------------------------------------------------
| Water intake (auth)
|--------------------------------------------------------------------------
*/
Route::middleware('auth')->group(function () {
    Route::post('/water', [WaterIntakeController::class, 'store'])->name('water.store');
});

/*
|--------------------------------------------------------------------------
| Profile (auth + verified)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/profile', [ProfileController::class, 'show'])->name('profile.show');
});

/*
|--------------------------------------------------------------------------
| Legacy Track Meals (auth)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth'])->group(function () {
    Route::get('/track-meals', [TrackMealsController::class, 'index'])->name('track-meals.index');
    Route::post('/track-meals/diet', [TrackMealsController::class, 'storeDiet'])->name('track-meals.diet.store');
    Route::post('/track-meals/log', [TrackMealsController::class, 'storeLog'])->name('track-meals.log.store');
});

/*
|--------------------------------------------------------------------------
| NEW Meal Tracker (auth) - Foods search + Meal entries
|--------------------------------------------------------------------------
*/
Route::middleware(['auth'])->group(function () {
    // Page & actions
    Route::get('/meal-tracker', [MealEntryController::class, 'index'])->name('meal.tracker');
    Route::post('/meal-entries', [MealEntryController::class, 'store'])->name('meal.entries.store');
    Route::delete('/meal-entries/{entry}', [MealEntryController::class, 'destroy'])->name('meal.entries.destroy');

    // JSON APIs for UI
    Route::get('/api/foods/search', [FoodController::class, 'search'])->name('foods.search');
    Route::get('/api/daily-macros', [MealEntryController::class, 'dailyMacros'])->name('meal.daily');
});

/*
|--------------------------------------------------------------------------
| Workouts (auth)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth'])->group(function () {
    // Planner page (matches resources/js/pages/workouts/Planner.tsx)
    Route::get('/workouts/plan', [WorkoutPlanController::class, 'index'])->name('workouts.plan');
    Route::post('/workouts/plan', [WorkoutPlanController::class, 'store'])->name('workouts.plan.store');

    // Log page (matches resources/js/pages/workouts/Log.tsx)
    Route::get('/workouts/log', [WorkoutLogController::class, 'index'])->name('workouts.log');
    Route::post('/workouts/log/start', [WorkoutLogController::class, 'start'])->name('workouts.log.start');
    Route::post('/workouts/log/{log}/add-set', [WorkoutLogController::class, 'addSet'])->name('workouts.log.addSet');
    Route::post('/workouts/log/{log}/finish', [WorkoutLogController::class, 'finish'])->name('workouts.log.finish');

    // Progress API
    Route::get('/workouts/progress', [WorkoutLogController::class, 'progress'])->name('workouts.progress');
});

/*
|--------------------------------------------------------------------------
| Profile (auth + verified)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/profile', [ProfileController::class, 'show'])->name('profile.show');

    // NEW endpoints used by the Profile/Show React page
    Route::post('/profile/update', [ProfileController::class, 'updateProfileBasic'])
        ->name('profile.update.basic');

    Route::post('/profile/prefs', [ProfileController::class, 'updatePrefs'])
        ->name('profile.prefs');

    Route::post('/profile/measurements', [ProfileController::class, 'addMeasurement'])
        ->name('profile.measurements.add');
});

