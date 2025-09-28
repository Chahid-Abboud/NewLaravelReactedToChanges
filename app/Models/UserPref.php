<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserPref extends Model
{
    protected $table = 'user_prefs';

    protected $fillable = [
        'user_id',
        'dietary_goal',        // string
        'fitness_goal',        // string (singular for consistency)
        'allergies',           // JSON
        'diet_name',           // string
        'diet_failure_other',  // optional extra
    ];

    protected $casts = [
        'allergies' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
