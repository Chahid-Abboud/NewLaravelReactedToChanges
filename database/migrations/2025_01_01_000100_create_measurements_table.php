<?php
// database/migrations/2025_01_01_000100_create_measurements_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('measurements', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->date('date');
            $t->enum('type', ['weight', 'height']);
            $t->unsignedSmallInteger('value'); // kg for weight, cm for height
            $t->timestamps();

            $t->unique(['user_id','date','type']);
        });
    }
    public function down(): void {
        Schema::dropIfExists('measurements');
    }
};
