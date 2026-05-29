<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('short_description', 500)->nullable();
            $table->integer('base_price_cents');
            $table->integer('compare_at_price_cents')->nullable();
            $table->integer('cost_price_cents')->nullable();
            $table->string('status', 20)->default('draft');
            $table->boolean('is_featured')->default(false);
            $table->string('meta_title')->nullable();
            $table->string('meta_description', 500)->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['status', 'is_featured']);
            $table->index('base_price_cents');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
