<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('processed_webhooks', function (Blueprint $table) {
            $table->id();
            $table->string('provider', 30);
            $table->string('event_id', 255);
            $table->timestamp('processed_at');

            $table->unique(['provider', 'event_id'], 'processed_webhooks_provider_event_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('processed_webhooks');
    }
};
