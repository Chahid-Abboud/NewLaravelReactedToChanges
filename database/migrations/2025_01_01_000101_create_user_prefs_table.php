<?php
// database/migrations/2025_01_01_000101_create_user_prefs_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('user_prefs', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $t->string('dietary_goal')->nullable();
            $t->json('fitness_goals')->nullable(); // ["Lose fat","Build muscle"]
            $t->json('allergies')->nullable();     // ["peanuts","lactose"]
            // Optional—only if you prefer not to rely on user_diets:
            $t->string('diet_type')->nullable();
            $t->string('diet_other')->nullable();
            $t->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('user_prefs');
    }
};
