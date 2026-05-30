<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            // Replace boolean is_approved with a status enum string
            $table->string('status', 20)->default('pending')->after('body');
            $table->boolean('verified_purchase')->default(false)->after('status');
            $table->text('rejection_reason')->nullable()->after('verified_purchase');

            // Better index for public listing
            $table->index(['product_id', 'status'], 'reviews_product_status_index');
        });

        // Migrate existing data: is_approved=true -> published, false -> pending
        DB::statement("UPDATE reviews SET status = 'published' WHERE is_approved = true");
        DB::statement("UPDATE reviews SET status = 'pending'   WHERE is_approved = false");

        Schema::table('reviews', function (Blueprint $table) {
            $table->dropIndex(['product_id', 'is_approved']);
            $table->dropColumn('is_approved');
        });
    }

    public function down(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->boolean('is_approved')->default(false);
            $table->index(['product_id', 'is_approved']);
        });

        DB::statement("UPDATE reviews SET is_approved = true  WHERE status = 'published'");
        DB::statement("UPDATE reviews SET is_approved = false WHERE status != 'published'");

        Schema::table('reviews', function (Blueprint $table) {
            $table->dropIndex('reviews_product_status_index');
            $table->dropColumn(['status', 'verified_purchase', 'rejection_reason']);
        });
    }
};
