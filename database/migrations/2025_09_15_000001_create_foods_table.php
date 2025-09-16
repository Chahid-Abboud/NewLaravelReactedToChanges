<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // If the table already exists (e.g., you imported via SQL), do nothing.
        if (Schema::hasTable('foods')) {
            return;
        }

        Schema::create('foods', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('category', ['breakfast','lunch','dinner','snack','drink']);
            $table->decimal('serving_size', 8, 2)->default(100.00);
            $table->enum('serving_unit', ['g','ml'])->default('g');

            $table->decimal('calories_kcal', 8, 1)->default(0);
            $table->decimal('protein_g', 8, 1)->default(0);
            $table->decimal('carbs_g', 8, 1)->default(0);
            $table->decimal('fat_g', 8, 1)->default(0);
            $table->decimal('fiber_g', 8, 1)->nullable();
            $table->decimal('sugar_g', 8, 1)->nullable();
            $table->integer('sodium_mg')->nullable();

            $table->timestamps();

            $table->unique(['name','category','serving_size','serving_unit'], 'uniq_food');
        });
    }

    public function down(): void
    {
        // Only drop if it exists
        if (Schema::hasTable('foods')) {
            Schema::drop('foods');
        }
    }
};
