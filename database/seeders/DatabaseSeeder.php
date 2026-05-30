<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Disable Scout indexing during seeding — run `php artisan scout:import "App\Models\Product"`
        // once Meilisearch is running to build the search index.
        config(['scout.driver' => 'null']);

        $this->call([
            AttributeSeeder::class,
            CategorySeeder::class,
            BrandSeeder::class,
            UserSeeder::class,
            ProductSeeder::class,
        ]);
    }
}
