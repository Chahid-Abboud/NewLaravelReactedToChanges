<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\WaterIntake;

class WaterIntakeController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'ml' => 'required|integer|min:10|max:5000',
        ]);

        $record = WaterIntake::firstOrCreate(
            [
                'user_id' => Auth::id(),
                'day'     => today()->toDateString(),
            ],
            [
                'ml'      => 0,
            ]
        );

        $record->increment('ml', $data['ml']);

        return back();
    }
}
