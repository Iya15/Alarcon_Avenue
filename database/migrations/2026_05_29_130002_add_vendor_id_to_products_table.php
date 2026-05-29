<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->foreignId('vendor_id')
                ->nullable()
                ->after('id')
                ->constrained('users')
                ->nullOnDelete();

            $table->index('vendor_id');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['vendor_id']);
            $table->dropIndex(['vendor_id']);
            $table->dropColumn('vendor_id');
        });
    }
};
