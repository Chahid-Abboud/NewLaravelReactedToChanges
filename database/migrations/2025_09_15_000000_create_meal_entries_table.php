<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('meal_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('food_id')->constrained('foods')->cascadeOnDelete();
            // Same categories as foods.category:
            $table->enum('meal_type', ['breakfast','lunch','dinner','snack','drink']);
            /**
             * 'servings' = multiplier relative to the food's base serving (your dataset uses 100 g or 100 ml).
             * Example: user eats 150 g of a 100 g base => servings = 1.5
             */
            $table->decimal('servings', 8, 2)->default(1.00);
            $table->date('eaten_at'); // store date only; you can switch to datetime if you want time-of-day
            $table->timestamps();

            $table->index(['user_id','eaten_at']);
            $table->index(['user_id','meal_type','eaten_at']);
        });
    }

    public function down(): void {
        Schema::dropIfExists('meal_entries');
    }
};
