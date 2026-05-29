<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->string('gateway', 50);
            $table->string('gateway_transaction_id')->nullable();
            $table->string('gateway_payment_intent_id')->nullable();
            $table->integer('amount_cents');
            $table->char('currency', 3)->default('PHP');
            $table->string('status', 30);
            $table->string('method', 50)->nullable();
            $table->string('last_four', 4)->nullable();
            $table->jsonb('metadata')->nullable();
            $table->timestamp('captured_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->timestamp('refunded_at')->nullable();
            $table->timestamps();

            $table->index('order_id');
            $table->index('gateway_transaction_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
