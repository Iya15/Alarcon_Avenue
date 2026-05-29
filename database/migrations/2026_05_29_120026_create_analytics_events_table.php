<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('analytics_events', function (Blueprint $table) {
            $table->id();
            $table->string('event_name', 100);
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('session_id', 100)->nullable();
            $table->string('subject_type', 100)->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->jsonb('properties')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 500)->nullable();
            $table->timestamp('created_at');

            $table->index(['event_name', 'created_at']);
            $table->index('user_id');
            $table->index('session_id');
            $table->index(['subject_type', 'subject_id']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('analytics_events');
    }
};
