<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_recommendations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('recommended_product_id')->constrained('products')->cascadeOnDelete();
            // Score combines co-purchase (weight 2) + co-view (weight 1) counts
            $table->decimal('score', 10, 2)->default(0);
            // reason is auditable: 'bought_together' > 'viewed_together' > 'similar_category'
            $table->string('reason', 30);
            $table->timestamps();

            $table->unique(['product_id', 'recommended_product_id']);
            $table->index(['product_id', 'score']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_recommendations');
    }
};
