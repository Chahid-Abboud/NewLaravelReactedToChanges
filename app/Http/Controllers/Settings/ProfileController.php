<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

// Optional models (used only if their tables exist)
use App\Models\UserPref;
use App\Models\Measurement;

class ProfileController extends Controller
{
    /**
     * Show the profile page props for Inertia.
     * - Reads prefs from user_prefs if present, else falls back to users columns you already use.
     * - Reads measurement history if the measurements table exists.
     */
    public function show(Request $request): Response
    {
        $user = $request->user();

        // ----- Preferences (robust across schemas) -----
        $hasPrefsTable = Schema::hasTable('user_prefs');
        $prefsRow = $hasPrefsTable ? $user->prefs()->first() : null;

        // Build prefs payload with graceful fallback to users columns you currently store.
        $prefs = [
            'dietary_goal'  => $prefsRow->dietary_goal
                ?? $user->dietary_goal
                ?? null,

            // array of strings
            'fitness_goals' => $prefsRow->fitness_goals
                ?? (is_array($user->fitness_goals ?? null) ? $user->fitness_goals : (
                    isset($user->fitness_goal) && $user->fitness_goal !== '' ? [(string)$user->fitness_goal] : []
                )),

            // if you later move diet_type into user_prefs, this will pick it up automatically
            'diet_type'     => $prefsRow->diet_type
                ?? $user->diet_type
                ?? ($user->diet_name ?? null),

            'diet_other'    => $prefsRow->diet_other
                ?? $user->diet_other
                ?? null,

            // array of strings
            'allergies'     => $prefsRow->allergies
                ?? (is_array($user->allergies ?? null) ? $user->allergies : []),
        ];

        // ----- Diet label (from user_diets/diets if present; else from diet_type/other; else —) -----
        $dietName = null;
        if (Schema::hasTable('user_diets') && Schema::hasTable('diets')) {
            $dietName = DB::table('user_diets')
                ->join('diets', 'diets.id', '=', 'user_diets.diet_id')
                ->where('user_diets.user_id', $user->id)
                ->orderByDesc('user_diets.created_at')
                ->value('diets.name');
        }
        if (!$dietName) {
            $type = $prefs['diet_type'];
            if ($type && strtolower($type) === 'other' && !empty($prefs['diet_other'])) {
                $dietName = $prefs['diet_other'];
            } else {
                $dietName = $type ?: '—';
            }
        }

        // ----- Measurement history (if table exists) -----
        $weightHistory = [];
        $heightHistory = [];
        if (Schema::hasTable('measurements')) {
            $weightHistory = $user->measurements()
                ->where('type', 'weight')
                ->orderByDesc('date')
                ->limit(24)
                ->get(['date', 'type', 'value']);
            $heightHistory = $user->measurements()
                ->where('type', 'height')
                ->orderByDesc('date')
                ->limit(24)
                ->get(['date', 'type', 'value']);
        }

        $displayName = $user->username ?: ($user->first_name ?: ($user->name ?: 'there'));

        return Inertia::render('Profile/Show', [
            'displayName'   => $displayName,
            'userProfile'   => [
                'first_name' => $user->first_name,
                'last_name'  => $user->last_name,
                'username'   => $user->username,
                'gender'     => $user->gender,
                'age'        => $user->age,
                'height_cm'  => $user->height_cm,
                'weight_kg'  => $user->weight_kg,
            ],
            'prefs'         => $prefs,
            'dietName'      => $dietName,
            // these are optional props used by the new UI
            'weightHistory' => $weightHistory,
            'heightHistory' => $heightHistory,
        ]);
    }

    /**
     * New endpoint used by the new React page to update basic profile fields.
     * Leaves your existing update(ProfileUpdateRequest) untouched.
     */
    public function updateProfileBasic(Request $request): RedirectResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'first_name' => ['nullable', 'string', 'max:120'],
            'last_name'  => ['nullable', 'string', 'max:120'],
            'username'   => ['nullable', 'string', 'max:120'],
            'gender'     => ['nullable', 'string', 'max:40'],
            'age'        => ['nullable', 'integer', 'min:0', 'max:130'],
        ]);

        $user->fill($data)->save();

        return back()->with('success', 'Profile updated.');
    }

    /**
     * New endpoint to save preferences.
     * If user_prefs exists, write there; otherwise fall back to users columns (so nothing breaks).
     */
    public function updatePrefs(Request $request): RedirectResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'diet_type'       => ['nullable', 'string', 'max:40'],
            'diet_other'      => ['nullable', 'string', 'max:120'],
            'dietary_goal'    => ['nullable', 'string', 'max:120'],
            'fitness_goals'   => ['nullable', 'array'],
            'fitness_goals.*' => ['string', 'max:80'],
            'allergies'       => ['nullable', 'array'],
            'allergies.*'     => ['string', 'max:80'],
        ]);

        // normalize "other"
        if (($data['diet_type'] ?? null) !== 'other') {
            $data['diet_other'] = null;
        }

        if (Schema::hasTable('user_prefs')) {
            // store in user_prefs (preferred)
            $user->prefs()->updateOrCreate(
                ['user_id' => $user->id],
                $data
            );
        } else {
            // fallback: store on users table if those columns exist in your schema
            $user->fill([
                'diet_type'      => $data['diet_type'] ?? $user->diet_type,
                'diet_other'     => $data['diet_other'] ?? $user->diet_other,
                'dietary_goal'   => $data['dietary_goal'] ?? $user->dietary_goal,
                'fitness_goals'  => $data['fitness_goals'] ?? $user->fitness_goals,
                'allergies'      => $data['allergies'] ?? $user->allergies,
            ])->save();
        }

        return back()->with('success', 'Preferences saved.');
    }

    /**
     * New endpoint to add/update a dated measurement (weight/height).
     * Writes to measurements if available and mirrors latest snapshot to users.height_cm/weight_kg.
     */
    public function addMeasurement(Request $request): RedirectResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'date'  => ['required', 'date'],
            'type'  => ['required', 'in:weight,height'],
            'value' => ['required', 'integer', 'min:1', 'max:1000'],
        ]);

        if (Schema::hasTable('measurements')) {
            Measurement::updateOrCreate(
                ['user_id' => $user->id, 'date' => $data['date'], 'type' => $data['type']],
                ['value' => $data['value']]
            );

            // Mirror latest snapshot into users
            $latestWeight = Measurement::where('user_id', $user->id)
                ->where('type', 'weight')
                ->orderByDesc('date')
                ->value('value');
            $latestHeight = Measurement::where('user_id', $user->id)
                ->where('type', 'height')
                ->orderByDesc('date')
                ->value('value');

            $user->forceFill([
                'weight_kg' => $latestWeight ?? $user->weight_kg,
                'height_cm' => $latestHeight ?? $user->height_cm,
            ])->save();
        } else {
            // Minimal fallback if you haven't added the measurements table yet:
            if ($data['type'] === 'weight') {
                $user->forceFill(['weight_kg' => $data['value']])->save();
            } else {
                $user->forceFill(['height_cm' => $data['value']])->save();
            }
        }

        return back()->with('success', 'Measurement saved.');
    }

    /* ----------------------------------------------------------------------
     * Your existing methods (left intact)
     * -------------------------------------------------------------------- */

    public function edit(Request $request): Response
    {
        return Inertia::render('Settings/Profile', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
        ]);
    }

    /** Existing settings form handler (email/name/etc). */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();
        $user->fill($request->validated());

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        return to_route('profile.edit');
    }

    /** Delete the user's account. */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate(['password' => ['required', 'current_password']]);

        $user = $request->user();
        Auth::logout();
        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
