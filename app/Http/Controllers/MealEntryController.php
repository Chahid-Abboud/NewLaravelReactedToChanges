<?php

namespace App\Http\Controllers;

use App\Models\MealEntry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class MealEntryController extends Controller
{
    public function index(Request $request)
    {
        $date = $request->date
            ? Carbon::parse($request->date)->format('Y-m-d')
            : now()->format('Y-m-d');

        [$dailyTotals, $byMeal, $entries] = $this->summaries(Auth::id(), $date);

        return Inertia::render('MealTracker', [
            'date'        => $date,
            'dailyTotals' => $dailyTotals,
            'mealTotals'  => $byMeal,
            'entries'     => $entries,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'food_id'   => ['required','exists:foods,id'],
            'meal_type' => ['required','in:breakfast,lunch,dinner,snack,drink'],
            'servings'  => ['required','numeric','gt:0','max:1000'],
            'eaten_at'  => ['nullable','date'],
        ]);

        $validated['user_id'] = Auth::id();
        $validated['eaten_at'] = isset($validated['eaten_at'])
            ? Carbon::parse($validated['eaten_at'])->format('Y-m-d')
            : now()->format('Y-m-d');

        MealEntry::create($validated);

        return back()->with('success', 'Added to your day.');
    }

    public function destroy(MealEntry $entry)
    {
        // ownership check instead of policies/authorize()
        if ($entry->user_id !== Auth::id()) {
            abort(403);
        }

        $entry->delete();
        return back()->with('success', 'Removed.');
    }

    public function dailyMacros(Request $request)
    {
        $date = $request->date
            ? Carbon::parse($request->date)->format('Y-m-d')
            : now()->format('Y-m-d');

        [$dailyTotals, $byMeal] = $this->summaries(Auth::id(), $date, false);

        return response()->json([
            'date'        => $date,
            'dailyTotals' => $dailyTotals,
            'mealTotals'  => $byMeal,
        ]);
    }

    private function summaries(int $userId, string $date, bool $includeEntries = true)
    {
        $dailyTotals = DB::table('meal_entries as me')
            ->join('foods as f', 'f.id', '=', 'me.food_id')
            ->selectRaw("
                COALESCE(SUM(f.calories_kcal * me.servings),0) as calories,
                COALESCE(SUM(f.protein_g     * me.servings),0) as protein,
                COALESCE(SUM(f.carbs_g       * me.servings),0) as carbs,
                COALESCE(SUM(f.fat_g         * me.servings),0) as fat
            ")
            ->where('me.user_id', $userId)
            ->whereDate('me.eaten_at', $date)
            ->first();

        $byMealRaw = DB::table('meal_entries as me')
            ->join('foods as f', 'f.id', '=', 'me.food_id')
            ->selectRaw("
                me.meal_type,
                COALESCE(SUM(f.calories_kcal * me.servings),0) as calories,
                COALESCE(SUM(f.protein_g     * me.servings),0) as protein,
                COALESCE(SUM(f.carbs_g       * me.servings),0) as carbs,
                COALESCE(SUM(f.fat_g         * me.servings),0) as fat
            ")
            ->where('me.user_id', $userId)
            ->whereDate('me.eaten_at', $date)
            ->groupBy('me.meal_type')
            ->get();

        $byMeal = [
            'breakfast' => ['calories'=>0,'protein'=>0,'carbs'=>0,'fat'=>0],
            'lunch'     => ['calories'=>0,'protein'=>0,'carbs'=>0,'fat'=>0],
            'dinner'    => ['calories'=>0,'protein'=>0,'carbs'=>0,'fat'=>0],
            'snack'     => ['calories'=>0,'protein'=>0,'carbs'=>0,'fat'=>0],
            'drink'     => ['calories'=>0,'protein'=>0,'carbs'=>0,'fat'=>0],
        ];

        foreach ($byMealRaw as $row) {
            $byMeal[$row->meal_type] = [
                'calories' => (float) $row->calories,
                'protein'  => (float) $row->protein,
                'carbs'    => (float) $row->carbs,
                'fat'      => (float) $row->fat,
            ];
        }

        $entries = [];
        if ($includeEntries) {
            $entries = MealEntry::with('food')
                ->where('user_id', $userId)
                ->whereDate('eaten_at', $date)
                ->orderBy('meal_type')->latest()
                ->get()
                ->map(function ($e) {
                    $ratio = (float) $e->servings;
                    $f = $e->food;
                    return [
                        'id'        => $e->id,
                        'meal_type' => $e->meal_type,
                        'servings'  => $ratio,
                        'eaten_at'  => $e->eaten_at ? $e->eaten_at->format('Y-m-d') : null,
                        'food'      => [
                            'id' => $f->id,
                            'name' => $f->name,
                            'serving_unit' => $f->serving_unit,
                            'serving_size' => (float) $f->serving_size,
                            'calories' => (float) $f->calories_kcal * $ratio,
                            'protein'  => (float) $f->protein_g     * $ratio,
                            'carbs'    => (float) $f->carbs_g       * $ratio,
                            'fat'      => (float) $f->fat_g         * $ratio,
                        ],
                    ];
                })->values();
        }

        return [
            [
                'calories' => (float) ($dailyTotals->calories ?? 0),
                'protein'  => (float) ($dailyTotals->protein  ?? 0),
                'carbs'    => (float) ($dailyTotals->carbs    ?? 0),
                'fat'      => (float) ($dailyTotals->fat      ?? 0),
            ],
            $byMeal,
            $entries,
        ];
    }
}
