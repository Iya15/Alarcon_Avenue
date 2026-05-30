<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('daily_traffic_summaries', function (Blueprint $table) {
            $table->id();
            $table->date('date')->unique();
            $table->unsignedInteger('sessions')->default(0);
            $table->unsignedInteger('product_views')->default(0);
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();

            $table->index('date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_traffic_summaries');
    }
};
