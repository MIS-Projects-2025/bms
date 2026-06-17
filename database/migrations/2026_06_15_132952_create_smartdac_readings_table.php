<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('smartdac_readings', function (Blueprint $table) {
    $table->id();
    $table->string('channel');
    $table->string('status')->nullable();
    $table->float('temperature')->nullable();
    $table->boolean('is_valid')->default(true);
    $table->timestamp('recorded_at');
    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('smartdac_readings');
    }
};
