<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('addresses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('label', 50)->nullable();
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->string('company', 100)->nullable();
            $table->string('line_1');
            $table->string('line_2')->nullable();
            $table->string('city', 100);
            $table->string('state', 100);
            $table->string('postal_code', 20);
            $table->char('country_code', 2)->default('PH');
            $table->string('phone', 30)->nullable();
            $table->boolean('is_default_shipping')->default(false);
            $table->boolean('is_default_billing')->default(false);
            $table->timestamps();

            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('addresses');
    }
};
