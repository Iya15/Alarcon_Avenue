<?php

namespace Database\Factories;

use App\Models\DailyTrafficSummary;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<DailyTrafficSummary> */
class DailyTrafficSummaryFactory extends Factory
{
    public function definition(): array
    {
        return [
            'date'          => fake()->unique()->dateTimeBetween('-90 days', 'now')->format('Y-m-d'),
            'sessions'      => fake()->numberBetween(50, 2000),
            'product_views' => fake()->numberBetween(100, 5000),
        ];
    }
}
