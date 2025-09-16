<?php
// app/Models/WorkoutLog.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkoutLog extends Model
{
    protected $fillable = ['user_id','workout_date','workout_plan_day_id','duration_min','notes'];
    protected $casts = ['workout_date' => 'date'];

    public function sets(): HasMany { return $this->hasMany(WorkoutLogSet::class); }
    public function planDay(): BelongsTo { return $this->belongsTo(WorkoutPlanDay::class); }
}
