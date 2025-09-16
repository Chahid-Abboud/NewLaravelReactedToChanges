<?php 
// app/Models/WorkoutPlan.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WorkoutPlan extends Model
{
    protected $fillable = ['user_id','name','days_per_week'];

    public function days(): HasMany {
        return $this->hasMany(WorkoutPlanDay::class)->orderBy('day_index');
    }
}
