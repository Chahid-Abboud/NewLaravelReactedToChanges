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
        $user  = Auth::user();
        $today = now()->toDateString();

        // ---- User profile (for BMI) ----
        $profile = $user ? [
            'age'       => isset($user->age) ? (int) $user->age : null,
            'height_cm' => isset($user->height_cm) ? (float) $user->height_cm : null,
            'weight_kg' => isset($user->weight_kg) ? (float) $user->weight_kg : null,
        ] : null;

        // ---- Water intake (guard table existence) ----
        $todayMl  = 0;
        $targetMl = 2000;

        if ($user) {
            if (is_numeric($user->weight_kg)) {
                $targetMl = (int) round(((float) $user->weight_kg) * 30);
            }

            if (Schema::hasTable('water_intakes')) {
                $todayMl = (int) (
                    WaterIntake::where('user_id', $user->id)
                        ->whereDate('day', $today)
                        ->value('ml') ?? 0
                );
            }
        }

        // ---- Legacy MealLog (today or latest) ----
        $todayLog  = null;
        $latestLog = null;

        if ($user && Schema::hasTable('meal_logs')) {
            $log = MealLog::with('items')
                ->where('user_id', $user->id)
                ->whereDate('consumed_at', $today)
                ->first();

            if ($log) {
                $todayLog = [
                    'id'          => $log->id,
                    'consumed_at' => optional($log->consumed_at)->format('Y-m-d'),
                    'photo_url'   => $log->photo_path ? asset('storage/' . ltrim($log->photo_path, '/')) : null,
                    'other_notes' => $log->other_notes,
                    'items'       => $log->items->map(fn ($i) => [
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
                        'consumed_at' => optional($last->consumed_at)->format('Y-m-d'),
                        'photo_url'   => $last->photo_path ? asset('storage/' . ltrim($last->photo_path, '/')) : null,
                        'other_notes' => $last->other_notes,
                        'items'       => $last->items->map(fn ($i) => [
                            'category' => $i->category,
                            'label'    => $i->label,
                            'quantity' => $i->quantity,
                            'unit'     => $i->unit,
                        ])->values(),
                    ];
                }
            }
        }

        // ---- New meal_entries/foods daily macros (guard tables) ----
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

            $byMeal = DB::table('meal_entries as me')
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

            // Ensure keys exist even if no rows for a given meal_type
            $mealTotals = [
                'breakfast' => ['calories'=>0,'protein'=>0,'carbs'=>0,'fat'=>0],
                'lunch'     => ['calories'=>0,'protein'=>0,'carbs'=>0,'fat'=>0],
                'dinner'    => ['calories'=>0,'protein'=>0,'carbs'=>0,'fat'=>0],
                'snack'     => ['calories'=>0,'protein'=>0,'carbs'=>0,'fat'=>0],
                'drink'     => ['calories'=>0,'protein'=>0,'carbs'=>0,'fat'=>0],
            ];

            foreach ($byMeal as $row) {
                $type = (string) $row->meal_type;
                if (!array_key_exists($type, $mealTotals)) {
                    $mealTotals[$type] = ['calories'=>0,'protein'=>0,'carbs'=>0,'fat'=>0];
                }
                $mealTotals[$type] = [
                    'calories' => (float) $row->calories,
                    'protein'  => (float) $row->protein,
                    'carbs'    => (float) $row->carbs,
                    'fat'      => (float) $row->fat,
                ];
            }
        }

        // ✅ Always return an Inertia page (never JSON)
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
