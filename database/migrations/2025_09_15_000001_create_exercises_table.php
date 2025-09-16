<?php 
// database/migrations/2025_09_15_000001_create_exercises_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('exercises', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->enum('primary_muscle', [
                'chest','back','shoulders','legs','glutes','biceps','triceps','core','calves'
            ]);
            $table->string('equipment')->nullable(); // e.g. barbell, dumbbell, machine, bodyweight
            $table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('exercises');
    }
};
