<?php 
// database/seeders/ExerciseSeeder.php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Exercise;

class ExerciseSeeder extends Seeder
{
    public function run(): void
    {
        $rows = [
            // chest
            ['Barbell Bench Press','chest','barbell','https://musclewiki.com/exercises/barbell/chest/bench-press'],
            ['Incline Dumbbell Press','chest','dumbbell','https://musclewiki.com/exercises/dumbbell/chest/incline-dumbbell-press'],
            ['Cable Fly','chest','cable','https://musclewiki.com/exercises/cable/chest/cable-fly'],
            // back
            ['Barbell Row','back','barbell','https://musclewiki.com/exercises/barbell/back/barbell-bent-over-row'],
            ['Lat Pulldown','back','machine','https://musclewiki.com/exercises/machine/back/lat-pulldown'],
            ['Seated Cable Row','back','cable','https://musclewiki.com/exercises/cable/back/seated-cable-row'],
            // shoulders
            ['Overhead Press','shoulders','barbell','https://musclewiki.com/exercises/barbell/shoulders/overhead-press'],
            ['Dumbbell Lateral Raise','shoulders','dumbbell','https://musclewiki.com/exercises/dumbbell/shoulders/dumbbell-lateral-raise'],
            ['Face Pull','shoulders','cable','https://musclewiki.com/exercises/cable/shoulders/face-pull'],
            // legs/glutes
            ['Back Squat','legs','barbell','https://musclewiki.com/exercises/barbell/quads/back-squat'],
            ['Romanian Deadlift','glutes','barbell','https://musclewiki.com/exercises/barbell/hamstrings/romanian-deadlift'],
            ['Leg Press','legs','machine','https://musclewiki.com/exercises/machine/quads/leg-press'],
            // arms
            ['Barbell Curl','biceps','barbell','https://musclewiki.com/exercises/barbell/biceps/barbell-curl'],
            ['Incline Dumbbell Curl','biceps','dumbbell','https://musclewiki.com/exercises/dumbbell/biceps/incline-dumbbell-curl'],
            ['Cable Triceps Pushdown','triceps','cable','https://musclewiki.com/exercises/cable/triceps/tricep-pushdown'],
            ['Skull Crushers','triceps','barbell','https://musclewiki.com/exercises/barbell/triceps/skull-crushers'],
            // core & calves
            ['Plank','core','bodyweight','https://musclewiki.com/exercises/bodyweight/abdominals/plank'],
            ['Hanging Leg Raise','core','bodyweight','https://musclewiki.com/exercises/bodyweight/abdominals/hanging-leg-raise'],
            ['Standing Calf Raise','calves','machine','https://musclewiki.com/exercises/machine/calves/standing-calf-raise'],
        ];

        foreach ($rows as [$name,$muscle,$equip,$url]) {
            Exercise::updateOrCreate(
                ['name'=>$name],
                ['primary_muscle'=>$muscle,'equipment'=>$equip,'demo_url'=>$url]
            );
        }
    }
}
