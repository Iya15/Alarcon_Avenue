<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\Payment;
use App\Models\Refund;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Refund> */
class RefundFactory extends Factory
{
    public function definition(): array
    {
        return [
            'order_id' => Order::factory(),
            'payment_id' => Payment::factory(),
            'refunded_by' => User::factory(),
            'reason' => fake()->optional()->sentence(),
            'notes' => fake()->optional()->sentence(),
            'total_cents' => fake()->numberBetween(5000, 100000),
            'status' => 'processed',
            'processed_at' => now(),
        ];
    }

    public function pending(): static
    {
        return $this->state(fn () => [
            'status' => 'pending',
            'processed_at' => null,
        ]);
    }
}
