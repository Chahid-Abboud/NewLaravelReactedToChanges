<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('foods')) return;

        // Check if uniq_food exists; if not, add it
        $hasIndex = collect(DB::select("SHOW INDEX FROM `foods` WHERE Key_name = 'uniq_food'"))->isNotEmpty();

        if (!$hasIndex) {
            Schema::table('foods', function (Blueprint $table) {
                $table->unique(['name','category','serving_size','serving_unit'], 'uniq_food');
            });
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('foods')) return;

        $hasIndex = collect(DB::select("SHOW INDEX FROM `foods` WHERE Key_name = 'uniq_food'"))->isNotEmpty();

        if ($hasIndex) {
            Schema::table('foods', function (Blueprint $table) {
                $table->dropUnique('uniq_food');
            });
        }
    }
};
