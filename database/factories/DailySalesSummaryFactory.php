<?php

namespace Database\Factories;

use App\Models\DailySalesSummary;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<DailySalesSummary> */
class DailySalesSummaryFactory extends Factory
{
    public function definition(): array
    {
        $gross = fake()->numberBetween(50000, 500000);
        $refunds = fake()->numberBetween(0, (int) ($gross * 0.05));

        return [
            'date'          => fake()->unique()->dateTimeBetween('-90 days', 'now')->format('Y-m-d'),
            'orders_count'  => fake()->numberBetween(1, 50),
            'gross_cents'   => $gross,
            'net_cents'     => $gross - $refunds,
            'refunds_cents' => $refunds,
            'items_sold'    => fake()->numberBetween(1, 100),
        ];
    }
}
