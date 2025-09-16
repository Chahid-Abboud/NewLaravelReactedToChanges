<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'first_name',
        'last_name',
        'username',
        'gender',
        'age',
        'height_cm',
        'weight_kg',
        'email',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        // If you're on Laravel 10+, this tells Laravel to hash automatically when assigning:
        // 'password' => 'hashed',
    ];

    // Preferences (user_prefs table)
    public function prefs()
    {
        return $this->hasOne(UserPref::class);
    }

    // Measurements history (measurements table)
    public function measurements()
    {
        return $this->hasMany(Measurement::class);
    }
}
