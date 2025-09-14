<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use App\Models\WaterIntake;

class HomeController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // Profile for BMI
       $profile = $user ? [
            'age'       => isset($user->age) ? (int) $user->age : null,
            'height_cm' => isset($user->height_cm) ? (float) $user->height_cm : null,
            'weight_kg' => isset($user->weight_kg) ? (float) $user->weight_kg : null,
        ] : null;

        // Today's water (per-day totals schema)
        $todayMl = $user
            ? (WaterIntake::where('user_id', $user->id)
                ->where('day', today()->toDateString())
                ->value('ml') ?? 0)
            : 0;

        // Simple target (or compute from weight, e.g., 30 ml/kg)
        $targetMl = ($user && is_numeric($user->weight_kg))
            ? (int) round($user->weight_kg * 30)
            : 2000;

        return Inertia::render('Home', [
            'userProfile' => $profile,
            'water'       => ['today_ml' => $todayMl, 'target_ml' => $targetMl],
            'isGuest'     => !$user,
        ]);
    }
}
