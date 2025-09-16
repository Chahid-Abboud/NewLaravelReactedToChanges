<?php
// database/migrations/2025_09_15_000003_create_workout_logs_tables.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('workout_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('workout_date'); // one session per date per plan day (not enforced)
            $table->foreignId('workout_plan_day_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedSmallInteger('duration_min')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['user_id','workout_date']);
        });

        Schema::create('workout_log_sets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workout_log_id')->constrained()->cascadeOnDelete();
            $table->foreignId('exercise_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('set_number'); // 1..n
            $table->decimal('weight_kg', 6, 2)->nullable(); // allow null for bodyweight
            $table->unsignedTinyInteger('reps');
            $table->timestamps();
            $table->unique(['workout_log_id','exercise_id','set_number']);
        });
    }

    public function down(): void {
        Schema::dropIfExists('workout_log_sets');
        Schema::dropIfExists('workout_logs');
    }
};
