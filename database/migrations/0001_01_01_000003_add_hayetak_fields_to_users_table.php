<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('first_name')->after('id');
            $table->string('last_name')->after('first_name');
            $table->string('username')->nullable()->unique()->after('last_name');
            $table->enum('gender', ['male','female','other'])->nullable()->after('username');
            $table->unsignedSmallInteger('age')->nullable()->after('gender');
            $table->unsignedSmallInteger('height_cm')->nullable()->after('age');
            $table->decimal('weight_kg', 5, 2)->nullable()->after('height_cm');

            $table->string('dietary_goal')->nullable()->after('weight_kg');
            $table->string('fitness_goal')->nullable()->after('dietary_goal');
            $table->string('diet_name')->nullable()->after('fitness_goal');
            $table->json('allergies')->nullable()->after('diet_name');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'first_name','last_name','username','gender','age','height_cm','weight_kg',
                'dietary_goal','fitness_goal','diet_name','allergies',
            ]);
        });
    }
};
