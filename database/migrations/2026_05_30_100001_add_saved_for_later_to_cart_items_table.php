<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cart_items', function (Blueprint $table) {
            $table->boolean('saved_for_later')->default(false)->after('unit_price_cents');
            $table->index('saved_for_later');
        });
    }

    public function down(): void
    {
        Schema::table('cart_items', function (Blueprint $table) {
            $table->dropIndex(['saved_for_later']);
            $table->dropColumn('saved_for_later');
        });
    }
};
