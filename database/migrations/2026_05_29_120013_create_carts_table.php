<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('carts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('session_id', 100)->nullable();
            $table->foreignId('coupon_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();

            $table->index('session_id');
        });

        DB::statement('CREATE UNIQUE INDEX carts_user_id_unique ON carts (user_id) WHERE user_id IS NOT NULL');
    }

    public function down(): void
    {
        Schema::dropIfExists('carts');
    }
};
