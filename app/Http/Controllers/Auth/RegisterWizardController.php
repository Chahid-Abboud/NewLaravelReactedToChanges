<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
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
            'prefill' => session('onboarding.profile', []),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'first_name'   => ['required','string','max:100'],
            'last_name'    => ['required','string','max:100'],
            'gender'       => ['nullable','in:male,female,other'],
            'age'          => ['nullable','integer','min:1','max:120'],
            'height_cm'    => ['nullable','integer','min:50','max:300'],
            'weight_kg'    => ['nullable','numeric','min:10','max:500'],
            'dietary_goal' => ['nullable','string','max:100'],
            'fitness_goal' => ['nullable','string','max:100'],
            'diet_name'    => ['nullable','string','max:100'],
            'allergies'    => ['nullable','array'],
            'allergies.*'  => ['string','max:100'],
        ]);

        // Save profile to session & go to Breeze register step
        session(['onboarding.profile' => $data]);

        return redirect()->route('register'); // Breeze GET /register
    }
}
