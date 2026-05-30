<?php

namespace Database\Factories;

use App\Models\DailyProductStats;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<DailyProductStats> */
class DailyProductStatsFactory extends Factory
{
    public function definition(): array
    {
        return [
            'date'          => fake()->dateTimeBetween('-90 days', 'now')->format('Y-m-d'),
            'product_id'    => Product::factory(),
            'units_sold'    => fake()->numberBetween(1, 20),
            'revenue_cents' => fake()->numberBetween(10000, 200000),
        ];
    }
}
