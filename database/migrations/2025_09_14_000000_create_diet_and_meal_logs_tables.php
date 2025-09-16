<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // A user's reusable “diet template”
        Schema::create('diets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name')->default('My Diet');
            $table->timestamps();
        });

        // Items that belong to a diet (breakfast/lunch/dinner/snack/drink)
        Schema::create('diet_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('diet_id')->constrained()->cascadeOnDelete();
            $table->enum('category', ['breakfast','lunch','dinner','snack','drink']);
            $table->string('label');                 // e.g. "Grilled chicken"
            $table->string('default_portion')->nullable(); // e.g. "150g" (optional)
            $table->unsignedInteger('calories')->nullable();
            $table->timestamps();
        });

        // Optional: track which diet is currently “active”
        Schema::create('user_diets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('diet_id')->constrained()->cascadeOnDelete();
            $table->date('active_from')->nullable();
            $table->date('active_to')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'diet_id']);
        });

        // A single day’s log (with optional photo)
        Schema::create('meal_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('consumed_at');                   // the day being logged
            $table->text('other_notes')->nullable();       // free text if used “Other”
            $table->string('photo_path')->nullable();      // optional image proof
            $table->timestamps();
            $table->unique(['user_id', 'consumed_at']);    // one log per user/day
        });

        // Items chosen within a day’s log
        Schema::create('meal_log_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('meal_log_id')->constrained()->cascadeOnDelete();
            $table->enum('category', ['breakfast','lunch','dinner','snack','drink']);
            $table->string('label');                 // chosen item label
            $table->decimal('quantity', 8, 2)->nullable();
            $table->string('unit')->nullable();      // e.g. "g", "ml", "pcs"
            $table->unsignedInteger('calories')->nullable();
            $table->timestamps();
            $table->index(['meal_log_id', 'category']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('meal_log_items');
        Schema::dropIfExists('meal_logs');
        Schema::dropIfExists('user_diets');
        Schema::dropIfExists('diet_items');
        Schema::dropIfExists('diets');
    }
};
