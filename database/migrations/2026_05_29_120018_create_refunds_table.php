<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('refunds', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('payment_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('refunded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('reason')->nullable();
            $table->text('notes')->nullable();
            $table->integer('total_cents');
            $table->string('status', 20)->default('pending');
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();

            $table->index('order_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('refunds');
    }
};
