<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('daily_product_stats', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('units_sold')->default(0);
            $table->unsignedBigInteger('revenue_cents')->default(0);
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();

            $table->unique(['date', 'product_id']);
            $table->index('date');
            $table->index('product_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_product_stats');
    }
};
