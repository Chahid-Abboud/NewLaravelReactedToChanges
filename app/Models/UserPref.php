<?php 
// app/Models/UserPref.php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class UserPref extends Model {
    protected $table = 'user_prefs';
    protected $fillable = [
        'user_id','dietary_goal','fitness_goals','allergies','diet_type','diet_other'
    ];
    protected $casts = [
        'fitness_goals' => 'array',
        'allergies' => 'array',
    ];
    public function user(){ return $this->belongsTo(\App\Models\User::class); }
}
