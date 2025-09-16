<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use App\Models\WaterIntake;
use App\Models\MealLog;

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

        // Today's date (ensure app.timezone is correct)
        $today = now()->format('Y-m-d');

        // Today's water
        $todayMl = $user
            ? (WaterIntake::where('user_id', $user->id)
                ->where('day', $today)
                ->value('ml') ?? 0)
            : 0;

        $targetMl = ($user && is_numeric($user->weight_kg))
            ? (int) round($user->weight_kg * 30)
            : 2000;

        // ---- Today's meals + latest fallback (legacy MealLog view) ----
        $todayLog = null;
        $latestLog = null;

        if ($user) {
            $log = MealLog::with('items')
                ->where('user_id', $user->id)
                ->whereDate('consumed_at', $today)
                ->first();

            if ($log) {
                $todayLog = [
                    'id'          => $log->id,
                    'consumed_at' => $log->consumed_at ? $log->consumed_at->format('Y-m-d') : null,
                    'photo_url'   => $log->photo_path ? asset('storage/'.$log->photo_path) : null,
                    'other_notes' => $log->other_notes,
                    'items'       => $log->items->map(fn($i) => [
                        'category' => $i->category,
                        'label'    => $i->label,
                        'quantity' => $i->quantity,
                        'unit'     => $i->unit,
                    ])->values(),
                ];
            } else {
                $last = MealLog::with('items')
                    ->where('user_id', $user->id)
                    ->orderByDesc('consumed_at')
                    ->first();

                if ($last) {
                    $latestLog = [
                        'id'          => $last->id,
                        'consumed_at' => $last->consumed_at ? $last->consumed_at->format('Y-m-d') : null,
                        'photo_url'   => $last->photo_path ? asset('storage/'.$last->photo_path) : null,
                        'other_notes' => $last->other_notes,
                        'items'       => $last->items->map(fn($i) => [
                            'category' => $i->category,
                            'label'    => $i->label,
                            'quantity' => $i->quantity,
                            'unit'     => $i->unit,
                        ])->values(),
                    ];
                }
            }
        }

        // ---- NEW: Today macros + per-meal totals from meal_entries + foods ----
        $todayMacros = null;
        $mealTotals  = null;

        if ($user && Schema::hasTable('meal_entries') && Schema::hasTable('foods')) {
            $daily = DB::table('meal_entries as me')
                ->join('foods as f', 'f.id', '=', 'me.food_id')
                ->selectRaw("
                    COALESCE(SUM(f.calories_kcal * me.servings),0) as calories,
                    COALESCE(SUM(f.protein_g     * me.servings),0) as protein,
                    COALESCE(SUM(f.carbs_g       * me.servings),0) as carbs,
                    COALESCE(SUM(f.fat_g         * me.servings),0) as fat
                ")
                ->where('me.user_id', $user->id)
                ->whereDate('me.eaten_at', $today)
                ->first();

            $todayMacros = [
                'date'     => $today,
                'calories' => (float) ($daily->calories ?? 0),
                'protein'  => (float) ($daily->protein  ?? 0),
                'carbs'    => (float) ($daily->carbs    ?? 0),
                'fat'      => (float) ($daily->fat      ?? 0),
            ];

            $byMealRaw = DB::table('meal_entries as me')
                ->join('foods as f', 'f.id', '=', 'me.food_id')
                ->selectRaw("
                    me.meal_type,
                    COALESCE(SUM(f.calories_kcal * me.servings),0) as calories,
                    COALESCE(SUM(f.protein_g     * me.servings),0) as protein,
                    COALESCE(SUM(f.carbs_g       * me.servings),0) as carbs,
                    COALESCE(SUM(f.fat_g         * me.servings),0) as fat
                ")
                ->where('me.user_id', $user->id)
                ->whereDate('me.eaten_at', $today)
                ->groupBy('me.meal_type')
                ->get();

            $mealTotals = [
                'breakfast' => ['calories'=>0,'protein'=>0,'carbs'=>0,'fat'=>0],
                'lunch'     => ['calories'=>0,'protein'=>0,'carbs'=>0,'fat'=>0],
                'dinner'    => ['calories'=>0,'protein'=>0,'carbs'=>0,'fat'=>0],
                'snack'     => ['calories'=>0,'protein'=>0,'carbs'=>0,'fat'=>0],
                'drink'     => ['calories'=>0,'protein'=>0,'carbs'=>0,'fat'=>0],
            ];

            foreach ($byMealRaw as $row) {
                $mealTotals[$row->meal_type] = [
                    'calories' => (float) $row->calories,
                    'protein'  => (float) $row->protein,
                    'carbs'    => (float) $row->carbs,
                    'fat'      => (float) $row->fat,
                ];
            }
        }

        return Inertia::render('Home', [
            'userProfile' => $profile,
            'water'       => ['today_ml' => $todayMl, 'target_ml' => $targetMl],
            'todayLog'    => $todayLog,
            'latestLog'   => $latestLog,
            'todayMacros' => $todayMacros,
            'mealTotals'  => $mealTotals,
            'isGuest'     => !$user,
        ]);
    }
}
