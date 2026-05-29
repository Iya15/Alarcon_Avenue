<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\Payment;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<Payment> */
class PaymentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'order_id' => Order::factory(),
            'gateway' => fake()->randomElement(['stripe', 'paymaya', 'gcash', 'paypal']),
            'gateway_transaction_id' => 'txn_' . Str::random(24),
            'gateway_payment_intent_id' => 'pi_' . Str::random(24),
            'amount_cents' => fake()->numberBetween(10000, 500000),
            'currency' => 'PHP',
            'status' => 'captured',
            'method' => fake()->randomElement(['card', 'e-wallet', 'bank_transfer']),
            'last_four' => fake()->optional()->numerify('####'),
            'metadata' => null,
            'captured_at' => now(),
            'failed_at' => null,
            'refunded_at' => null,
        ];
    }

    public function failed(): static
    {
        return $this->state(fn () => [
            'status' => 'failed',
            'captured_at' => null,
            'failed_at' => now(),
        ]);
    }

    public function refunded(): static
    {
        return $this->state(fn () => [
            'status' => 'refunded',
            'refunded_at' => now(),
        ]);
    }
}
