<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail; // enable if you want email verification
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable /* implements MustVerifyEmail */
{
    use HasFactory, Notifiable;

    protected $fillable = [
        // Basic profile
        'first_name',
        'last_name',
        'username',
        'gender',
        'age',
        'height_cm',
        'weight_kg',

        // Medical
        'has_medical_history',
        'medical_history',

        // Goals / diet
        'dietary_goal',
        'fitness_goal',
        'diet_name',
        'allergies',                 // JSON

        // Diet experience
        'tried_diet_before',
        'diet_failure_reasons',      // JSON
        'diet_failure_other',

        // Auth
        'email',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        // Scalars
        'age'                 => 'integer',
        'height_cm'           => 'integer',
        'weight_kg'           => 'integer',
        'has_medical_history' => 'boolean',

        // JSON arrays
        'allergies'           => 'array',
        'diet_failure_reasons'=> 'array',

        // Auth / timestamps
        'email_verified_at'   => 'datetime',

        // Security
        'password'            => 'hashed',
    ];

    protected $attributes = [
        'has_medical_history' => false,
    ];

    /* ---------------------------
     | Relationships
     |--------------------------- */

    public function prefs(): HasOne
    {
        return $this->hasOne(UserPref::class, 'user_id');
    }

    public function measurements(): HasMany
    {
        return $this->hasMany(Measurement::class, 'user_id');
    }

    /* ---------------------------
     | Mutators / Normalizers
     |--------------------------- */

    public function setFirstNameAttribute($value): void
    {
        $this->attributes['first_name'] = $value !== null ? trim($value) : null;
    }

    public function setLastNameAttribute($value): void
    {
        $this->attributes['last_name'] = $value !== null ? trim($value) : null;
    }

    public function setUsernameAttribute($value): void
    {
        $this->attributes['username'] = $value !== null ? strtolower(trim($value)) : null;
    }

    public function setEmailAttribute($value): void
    {
        $this->attributes['email'] = $value !== null ? strtolower(trim($value)) : null;
    }

    public function setDietNameAttribute($value): void
    {
        $this->attributes['diet_name'] = $value !== null ? trim($value) : null;
    }

    public function setDietFailureOtherAttribute($value): void
    {
        $this->attributes['diet_failure_other'] = $value !== null ? trim($value) : null;
    }

    /* ---------------------------
     | Accessors / Helpers
     |--------------------------- */

    public function getDisplayNameAttribute(): string
    {
        $first = trim((string) ($this->first_name ?? ''));
        $last  = trim((string) ($this->last_name ?? ''));
        $full  = trim($first . ' ' . $last);

        return $full !== '' ? $full : ($this->username ?? $this->email ?? 'User');
    }

    public function scopeWhereLogin($query, string $login)
    {
        $login = strtolower(trim($login));
        return $query->where(function ($q) use ($login) {
            $q->where('username', $login)->orWhere('email', $login);
        });
    }
}
