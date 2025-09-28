<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;

class RegisterWizardController extends Controller
{
    /**
     * If you render a wizard page via Inertia/Blade, keep this.
     * Otherwise you can remove it.
     */
    public function create()
    {
        return inertia('Auth/RegisterWizard');
    }

    /**
     * Handle final submit from the multi-step register wizard.
     */
    public function store(Request $request)
    {
        // Validate everything the wizard collects
        $data = $request->validate([
            // account
            'email'                 => ['required','email','max:255', Rule::unique('users','email')],
            'password'              => ['required','string','min:8','max:255'],
            'username'              => ['nullable','string','max:50', Rule::unique('users','username')],

            // profile
            'first_name'            => ['required','string','max:100'],
            'last_name'             => ['required','string','max:100'],
            'gender'                => ['nullable','string','max:25'],
            'age'                   => ['nullable','integer','min:10','max:120'],
            'height_cm'             => ['nullable','numeric','min:50','max:260'],
            'weight_kg'             => ['nullable','numeric','min:20','max:500'],

            // health
            'has_medical_history'   => ['required','boolean'],
            'medical_history'       => ['nullable','string','max:2000'],

            // diet & fitness choices
            'dietary_goal'          => ['nullable','string','max:100'],    // e.g. "Calorie Deficit"
            'fitness_goal'          => ['nullable','string','max:100'],    // e.g. "Build Muscle"
            'diet_name'             => ['nullable','string','max:100'],    // e.g. "Mediterranean"
            'allergies'             => ['nullable','array'],
            'allergies.*'           => ['string','max:100'],

            // past diet attempts
            'tried_diet_before'     => ['nullable','in:yes,no'],
            'diet_failure_reasons'  => ['nullable','array'],
            'diet_failure_reasons.*'=> ['string','max:100'],
            'diet_failure_other'    => ['nullable','string','max:255'],
        ]);

        // Ensure arrays default to [] so JSON columns are always consistent
        $data['allergies']            = $data['allergies'] ?? [];
        $data['diet_failure_reasons'] = $data['diet_failure_reasons'] ?? [];

        // Hash password
        $plainPassword = $data['password'];
        $data['password'] = Hash::make($plainPassword);

        // Create the user (no `name` column!)
        $user = DB::transaction(function () use ($data) {
            return User::create([
                'email'                => $data['email'],
                'password'             => $data['password'],
                'username'             => $data['username'] ?? null,

                'first_name'           => $data['first_name'],
                'last_name'            => $data['last_name'],
                'gender'               => $data['gender'] ?? null,
                'age'                  => $data['age'] ?? null,
                'height_cm'            => $data['height_cm'] ?? null,
                'weight_kg'            => $data['weight_kg'] ?? null,

                'has_medical_history'  => (bool) $data['has_medical_history'],
                'medical_history'      => $data['medical_history'] ?? null,

                'dietary_goal'         => $data['dietary_goal'] ?? null,
                'fitness_goal'         => $data['fitness_goal'] ?? null,
                'diet_name'            => $data['diet_name'] ?? null,
                'allergies'            => $data['allergies'],
                'tried_diet_before'    => $data['tried_diet_before'] ?? null,
                'diet_failure_reasons' => $data['diet_failure_reasons'],
                'diet_failure_other'   => $data['diet_failure_other'] ?? null,
            ]);
        });

        // Log them in and redirect
        Auth::login($user);

        // If you're using Laravel's login response, you could also regenerate the session:
        $request->session()->regenerate();

        return redirect()->intended('/home');
    }
}
