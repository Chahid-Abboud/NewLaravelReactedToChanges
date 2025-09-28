<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Basic profile
            $table->string('first_name', 40)->nullable()->after('id');
            $table->string('last_name', 40)->nullable()->after('first_name');
            $table->string('username', 24)->nullable()->unique()->after('last_name');
            $table->enum('gender', ['male','female','other'])->nullable()->after('username');
            $table->unsignedTinyInteger('age')->nullable()->after('gender'); // 0–255
            $table->unsignedSmallInteger('height_cm')->nullable()->after('age'); // 0–65535
            $table->unsignedSmallInteger('weight_kg')->nullable()->after('height_cm');

            // Medical
            $table->boolean('has_medical_history')->default(false)->after('weight_kg');
            $table->text('medical_history')->nullable()->after('has_medical_history');

            // Goals / diet
            $table->string('dietary_goal', 60)->nullable()->after('medical_history');
            $table->string('fitness_goal', 60)->nullable()->after('dietary_goal');
            $table->string('diet_name', 60)->nullable()->after('fitness_goal');
            $table->json('allergies')->nullable()->after('diet_name');

            // Diet experience
            $table->enum('tried_diet_before', ['yes','no'])->nullable()->after('allergies');
            $table->json('diet_failure_reasons')->nullable()->after('tried_diet_before');
            $table->string('diet_failure_other', 120)->nullable()->after('diet_failure_reasons');

            // Ensure email unique if not already
            // (Comment out if your users table already has a unique index on email)
            // $table->unique('email');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Drop in reverse
            $table->dropColumn([
                'first_name','last_name','username','gender','age','height_cm','weight_kg',
                'has_medical_history','medical_history',
                'dietary_goal','fitness_goal','diet_name','allergies',
                'tried_diet_before','diet_failure_reasons','diet_failure_other',
            ]);

            // If you added a unique on email in up(), drop it here
            // $table->dropUnique(['email']);
        });
    }
};
