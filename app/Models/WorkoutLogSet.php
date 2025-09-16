<?php 
// app/Models/WorkoutLogSet.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkoutLogSet extends Model
{
    protected $fillable = ['workout_log_id','exercise_id','set_number','weight_kg','reps'];

    public function log(): BelongsTo { return $this->belongsTo(WorkoutLog::class,'workout_log_id'); }
    public function exercise(): BelongsTo { return $this->belongsTo(Exercise::class); }
}
