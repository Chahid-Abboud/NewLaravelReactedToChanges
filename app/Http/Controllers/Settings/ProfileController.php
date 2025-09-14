<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function show(Request $request): Response
    {
        $user = $request->user();            // <= typed, linter-friendly

        $prefs = [
            'dietary_goal'  => $user->dietary_goal ?? null,
            'fitness_goals' => $user->fitness_goals ?: (
                isset($user->fitness_goal) && $user->fitness_goal !== ''
                    ? [ (string) $user->fitness_goal ]
                    : []
            ),
            'diet_type'     => $user->diet_type ?? ($user->diet_name ?? null),
            'diet_other'    => $user->diet_other ?? null,
            'allergies'     => $user->allergies ?: [],
        ];

        $displayName = $user->username ?: $user->first_name;
        $dietName = ($prefs['diet_type'] === 'Other' && $prefs['diet_other'])
            ? $prefs['diet_other']
            : ($prefs['diet_type'] ?? '—');

        return Inertia::render('Profile/Show', [   // <= make sure this matches your file path
            'displayName' => $displayName,
            'userProfile' => [
                'first_name' => $user->first_name,
                'last_name'  => $user->last_name,
                'username'   => $user->username,
                'gender'     => $user->gender,
                'age'        => $user->age,
                'height_cm'  => $user->height_cm,
                'weight_kg'  => $user->weight_kg,
            ],
            'prefs'       => $prefs,
            'dietName'    => $dietName,
        ]);
    }

    public function edit(Request $request): Response
    {
        // Make sure the component exists at resources/js/Pages/Settings/Profile.tsx
        return Inertia::render('Settings/Profile', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
        ]);
    }

    /** Update the user's profile settings. */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();
        $user->fill($request->validated());

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        return to_route('profile.edit');  // <= route exists in routes/web.php above
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
