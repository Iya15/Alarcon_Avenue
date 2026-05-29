<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            AttributeSeeder::class,
            CategorySeeder::class,
            UserSeeder::class,
            ProductSeeder::class,
        ]);
    }
}
