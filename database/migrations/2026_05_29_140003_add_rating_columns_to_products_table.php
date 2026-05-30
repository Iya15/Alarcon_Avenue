<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->decimal('rating_average', 3, 2)->nullable()->after('is_featured');
            $table->unsignedInteger('review_count')->default(0)->after('rating_average');

            $table->index('rating_average');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['rating_average']);
            $table->dropColumn(['rating_average', 'review_count']);
        });
    }
};
