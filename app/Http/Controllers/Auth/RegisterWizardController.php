<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class RegisterWizardController extends Controller
{
    public function create()
    {
        return Inertia::render('Auth/RegisterWizard', [
            'dietOptions' => [
                'Mediterranean','Keto','Paleo','Vegan','Vegetarian','DASH','Low-Carb','High-Protein',
                'Intermittent Fasting','Whole30'
            ],
            'allergyOptions' => [
                'Peanuts','Tree Nuts','Milk','Eggs','Wheat','Soy','Fish','Shellfish','Sesame','Gluten',
                'Mustard','Celery','Lupin','Sulphites','Corn','Gelatin','Coconut','Kiwi','Banana','Avocado',
                'Tomato','Strawberry','Chocolate','Garlic','Onion'
            ],
            'fitnessGoals' => ['Lose Weight','Maintain','Build Muscle','Improve Endurance','Recomposition'],
            'dietaryGoals' => ['Calorie Deficit','Maintenance','Calorie Surplus','Balanced Nutrition'],
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'first_name' => ['required','string','max:100'],
            'last_name'  => ['required','string','max:100'],
            'username'   => ['nullable','string','max:50', Rule::unique('users','username')],
            'gender'     => ['nullable', Rule::in(['male','female','other'])],
            'age'        => ['nullable','integer','min:1','max:120'],
            'height_cm'  => ['nullable','integer','min:50','max:300'],
            'weight_kg'  => ['nullable','numeric','min:10','max:500'],

            'dietary_goal' => ['nullable','string','max:100'],
            'fitness_goal' => ['nullable','string','max:100'],
            'diet_name'    => ['nullable','string','max:100'],
            'allergies'    => ['nullable','array'],
            'allergies.*'  => ['string','max:100'],

            'email'    => ['required','email','max:255', Rule::unique('users','email')],
            'password' => ['required','string','min:8','confirmed'],
        ]);

        $user = User::create([
            'first_name' => $data['first_name'],
            'last_name'  => $data['last_name'],
            'username'   => $data['username'] ?? null,
            'gender'     => $data['gender'] ?? null,
            'age'        => $data['age'] ?? null,
            'height_cm'  => $data['height_cm'] ?? null,
            'weight_kg'  => $data['weight_kg'] ?? null,

            'dietary_goal' => $data['dietary_goal'] ?? null,
            'fitness_goal' => $data['fitness_goal'] ?? null,
            'diet_name'    => $data['diet_name'] ?? null,
            'allergies'    => $data['allergies'] ?? null, // casted to JSON by model

            'email'    => $data['email'],
            'password' => Hash::make($data['password']),
            'name' => $request->first_name . ' ' . $request->last_name,
        ]);

        event(new Registered($user));
        Auth::login($user, false);
        


    // Option A (strict): do NOT auto-login
    return redirect()->route('login')->with('status', 'Account created. Please log in.');
    // Option B: keep Auth::login($user, false);  // still fine with step #2 in place

    }
}
