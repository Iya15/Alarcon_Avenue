<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('daily_sales_summaries', function (Blueprint $table) {
            $table->id();
            $table->date('date')->unique();
            $table->unsignedInteger('orders_count')->default(0);
            $table->unsignedBigInteger('gross_cents')->default(0);
            $table->unsignedBigInteger('net_cents')->default(0);
            $table->unsignedBigInteger('refunds_cents')->default(0);
            $table->unsignedInteger('items_sold')->default(0);
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();

            $table->index('date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_sales_summaries');
    }
};
