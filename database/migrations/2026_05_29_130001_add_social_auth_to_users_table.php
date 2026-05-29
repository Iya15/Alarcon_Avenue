<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('social_provider', 30)->nullable()->after('is_active');
            $table->string('social_id', 255)->nullable()->after('social_provider');
            $table->string('social_avatar', 500)->nullable()->after('social_id');

            $table->unique(['social_provider', 'social_id'], 'users_social_provider_id_unique');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique('users_social_provider_id_unique');
            $table->dropColumn(['social_provider', 'social_id', 'social_avatar']);
        });
    }
};
