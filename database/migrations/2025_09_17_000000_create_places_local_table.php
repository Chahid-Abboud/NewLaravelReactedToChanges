<?php
// database/migrations/2025_09_17_000000_create_places_local_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('places_local', function (Blueprint $table) {
            $table->id();
            $table->string('first_name');
            $table->string('last_name');
            $table->enum('category', ['gym','nutritionist']);
            $table->decimal('lat', 10, 6);
            $table->decimal('lng', 10, 6);
            $table->string('address')->nullable();
            $table->string('city')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('places_local');
    }
};
