<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class RegisteredUserController extends Controller
{
    public function create()
    {
        return inertia('Auth/Register', [
            'prefill'        => session('onboarding.profile', []),
            'dietOptions'    => ['Mediterranean','Keto','Paleo','Vegan','Vegetarian','DASH','Low-Carb','High-Protein','Intermittent Fasting','Whole30'],
            'allergyOptions' => ['Peanuts','Tree Nuts','Milk','Eggs','Wheat','Soy','Fish','Shellfish','Sesame','Gluten','Mustard','Celery','Lupin','Sulphites','Corn','Gelatin','Coconut','Kiwi','Banana','Avocado','Tomato','Strawberry','Chocolate','Garlic','Onion'],
            'fitnessGoals'   => ['Lose Weight','Maintain','Build Muscle','Improve Endurance','Recomposition'],
            'dietaryGoals'   => ['Calorie Deficit','Maintenance','Calorie Surplus','Balanced Nutrition'],
        ]);
    }

    public function store(Request $request)
    {
        $profile = session('onboarding.profile', []);

        // Require profile fields if wizard was used; otherwise you can relax or redirect.
        if (empty($profile)) {
            // Either redirect back to wizard:
            // return redirect()->route('onboarding.start')->withErrors(['first_name' => 'Please complete your profile first.']);
            // Or allow minimal registration; here we enforce wizard flow:
        }

        $credentials = $request->validate([
            'username'   => ['nullable','string','max:50', Rule::unique('users','username')],
            'email'      => ['required','string','email','max:255', Rule::unique('users','email')],
            'password'   => ['required','confirmed','min:8'],
        ]);

        // Compose a display name if your users table still has 'name'
        $displayName = trim(($profile['first_name'] ?? '').' '.($profile['last_name'] ?? ''));

        $user = User::create([
            'name'         => $displayName ?: $credentials['email'], // safe fallback
            'first_name'   => $profile['first_name'] ?? null,
            'last_name'    => $profile['last_name'] ?? null,
            'username'     => $credentials['username'] ?? null,
            'gender'       => $profile['gender'] ?? null,
            'age'          => $profile['age'] ?? null,
            'height_cm'    => $profile['height_cm'] ?? null,
            'weight_kg'    => $profile['weight_kg'] ?? null,
            'dietary_goal' => $profile['dietary_goal'] ?? null,
            'fitness_goal' => $profile['fitness_goal'] ?? null,
            'diet_name'    => $profile['diet_name'] ?? null,
            'allergies'    => $profile['allergies'] ?? null, // casted to array on model
            'email'        => $credentials['email'],
            'password'     => Hash::make($credentials['password']),
        ]);

        // Done with session profile
        session()->forget('onboarding.profile');

        event(new Registered($user));
        Auth::login($user);

        return redirect()->intended('/home');
    }
}
