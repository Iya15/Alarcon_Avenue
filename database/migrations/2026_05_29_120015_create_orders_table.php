<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('guest_email')->nullable();
            $table->string('order_number', 30)->unique();
            $table->string('status', 30)->default('pending');
            $table->jsonb('shipping_address');
            $table->jsonb('billing_address');
            $table->foreignId('coupon_id')->nullable()->constrained()->nullOnDelete();
            $table->integer('subtotal_cents');
            $table->integer('discount_cents')->default(0);
            $table->integer('shipping_cents')->default(0);
            $table->integer('tax_cents')->default(0);
            $table->integer('total_cents');
            $table->char('currency', 3)->default('PHP');
            $table->text('customer_notes')->nullable();
            $table->text('admin_notes')->nullable();
            $table->timestamp('shipped_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
