<?php 
// database/migrations/2025_09_15_000002_create_workout_plans_tables.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('workout_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name')->default('My Plan');
            $table->unsignedTinyInteger('days_per_week'); // 1..7
            $table->timestamps();
        });

        Schema::create('workout_plan_days', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workout_plan_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('day_index'); // 1..7
            $table->string('title')->nullable(); // e.g. Push / Pull / Legs
            $table->timestamps();
            $table->unique(['workout_plan_id','day_index']);
        });

        Schema::create('workout_plan_day_exercise', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workout_plan_day_id')->constrained()->cascadeOnDelete();
            $table->foreignId('exercise_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('target_sets')->default(3);
            $table->unsignedTinyInteger('target_reps')->default(10);
            $table->timestamps();
            $table->unique(['workout_plan_day_id','exercise_id']);
        });
    }

    public function down(): void {
        Schema::dropIfExists('workout_plan_day_exercise');
        Schema::dropIfExists('workout_plan_days');
        Schema::dropIfExists('workout_plans');
    }
};
