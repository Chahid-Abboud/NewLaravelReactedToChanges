<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use Notifiable;

    protected $fillable = [
        'first_name','last_name','username','gender','age','height_cm','weight_kg',
        'dietary_goal','fitness_goal','diet_name','allergies',
        'email','password',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'allergies' => 'array',
        'fitness_goals' => 'array',
    ];

    protected $hidden = [
        'password','remember_token',
    ];
}
