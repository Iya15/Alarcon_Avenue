<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attributes', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->unique();
            $table->string('display_name', 100);
            $table->string('type', 30)->default('select');
            $table->smallInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attributes');
    }
};
