<?php // app/Models/WorkoutPlanDay.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class WorkoutPlanDay extends Model
{
    protected $fillable = ['workout_plan_id','day_index','title'];

    public function plan(): BelongsTo { return $this->belongsTo(WorkoutPlan::class); }

    public function exercises(): BelongsToMany {
        return $this->belongsToMany(Exercise::class, 'workout_plan_day_exercise')
            ->withPivot(['target_sets','target_reps'])
            ->withTimestamps();
    }
}
