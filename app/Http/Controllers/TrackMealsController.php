<?php

namespace App\Http\Controllers;

use App\Models\Diet;
use App\Models\DietItem;
use App\Models\MealLog;
use App\Models\MealLogItem;
use App\Models\UserDiet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Illuminate\Validation\Rule;

class TrackMealsController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        // Find active diet (if any)
        $activeDietId = UserDiet::query()
            ->where('user_id', $user->id)
            ->where(function ($q) {
                $q->whereNull('active_to')->orWhere('active_to', '>=', now()->toDateString());
            })
            ->orderByDesc('active_from')
            ->value('diet_id');

        $diet = null;
        if ($activeDietId) {
            $diet = Diet::with('items')
                ->where('id', $activeDietId)
                ->where('user_id', $user->id)
                ->first();
        }

        return Inertia::render('TrackMeals/TrackMeals', [
            'diet' => $diet ? [
                'id' => $diet->id,
                'name' => $diet->name,
                'items' => $diet->items->map(fn($i) => [
                    'id' => $i->id,
                    'category' => $i->category,
                    'label' => $i->label,
                    'default_portion' => $i->default_portion,
                    'calories' => $i->calories,
                ])->values(),
            ] : null,
            'today' => now()->toDateString(),
        ]);
    }

    // Save/replace the user’s diet template
    public function storeDiet(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'name' => ['required','string','max:120'],
            'items' => ['array'],
            'items.*.category' => ['required', Rule::in(['breakfast','lunch','dinner','snack','drink'])],
            'items.*.label' => ['required','string','max:255'],
            'items.*.default_portion' => ['nullable','string','max:120'],
            'items.*.calories' => ['nullable','integer','min:0'],
        ]);

        // Create/replace diet
        $diet = Diet::create([
            'user_id' => $user->id,
            'name'    => $validated['name'],
        ]);

        $bulk = [];
        foreach ($validated['items'] ?? [] as $row) {
            $bulk[] = [
                'diet_id' => $diet->id,
                'category' => $row['category'],
                'label' => $row['label'],
                'default_portion' => $row['default_portion'] ?? null,
                'calories' => $row['calories'] ?? null,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        if ($bulk) {
            DietItem::insert($bulk);
        }

        // Mark as active
        UserDiet::create([
            'user_id' => $user->id,
            'diet_id' => $diet->id,
            'active_from' => now()->toDateString(),
        ]);

        return back()->with('success', 'Diet saved.');
    }

    // Log what user ate for a day (with optional "Other" + photo)
    public function storeLog(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'consumed_at' => ['required','date'],
            'other_notes' => ['nullable','string','max:2000'],
            'photo' => ['nullable','image','mimes:jpg,jpeg,png,webp','max:5120'],
            'selections' => ['array'], // [{category,label,quantity,unit,calories}]
            'selections.*.category' => [Rule::in(['breakfast','lunch','dinner','snack','drink'])],
            'selections.*.label' => ['required','string','max:255'],
            'selections.*.quantity' => ['nullable','numeric','min:0'],
            'selections.*.unit' => ['nullable','string','max:50'],
            'selections.*.calories' => ['nullable','integer','min:0'],
        ]);

        // Either create or update same-day log
        $log = MealLog::firstOrCreate(
            ['user_id' => $user->id, 'consumed_at' => $validated['consumed_at']],
            ['other_notes' => $validated['other_notes'] ?? null]
        );

        // Handle photo upload
        if ($request->hasFile('photo')) {
            $path = $request->file('photo')->store('meal-photos', 'public');
            // delete old photo if replacing
            if ($log->photo_path && $log->photo_path !== $path) {
                Storage::disk('public')->delete($log->photo_path);
            }
            $log->photo_path = $path;
        }

        $log->other_notes = $validated['other_notes'] ?? null;
        $log->save();

        // Replace items for that day
        $log->items()->delete();

        $bulk = [];
        foreach ($validated['selections'] ?? [] as $sel) {
            $bulk[] = [
                'meal_log_id' => $log->id,
                'category' => $sel['category'],
                'label' => $sel['label'],
                'quantity' => $sel['quantity'] ?? null,
                'unit' => $sel['unit'] ?? null,
                'calories' => $sel['calories'] ?? null,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        if ($bulk) {
            MealLogItem::insert($bulk);
        }

        return back()->with('success', 'Your meals for the day were logged.');
    }
}
