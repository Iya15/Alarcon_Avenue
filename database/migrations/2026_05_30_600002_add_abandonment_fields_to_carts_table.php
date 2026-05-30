<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('carts', function (Blueprint $table) {
            // null = active, 'abandoned' = flagged by job, 'recovered' = converted to order
            $table->string('status', 20)->nullable()->after('coupon_id');
            $table->timestamp('abandoned_at')->nullable()->after('status');
            $table->timestamp('recovered_at')->nullable()->after('abandoned_at');

            $table->index(['status', 'updated_at']);
        });
    }

    public function down(): void
    {
        Schema::table('carts', function (Blueprint $table) {
            $table->dropIndex(['status', 'updated_at']);
            $table->dropColumn(['status', 'abandoned_at', 'recovered_at']);
        });
    }
};
