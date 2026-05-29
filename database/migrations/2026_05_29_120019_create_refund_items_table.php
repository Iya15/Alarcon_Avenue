<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('refund_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('refund_id')->constrained()->cascadeOnDelete();
            $table->foreignId('order_item_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('quantity');
            $table->integer('amount_cents');
            $table->text('reason')->nullable();
            $table->timestamps();

            $table->index('refund_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('refund_items');
    }
};
