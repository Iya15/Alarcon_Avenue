<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Order> */
class OrderFactory extends Factory
{
    public function definition(): array
    {
        $subtotal = fake()->numberBetween(10000, 500000);
        $discount = fake()->numberBetween(0, (int) ($subtotal * 0.2));
        $shipping = fake()->randomElement([0, 5000, 10000, 15000]);
        $tax = 0;
        $total = $subtotal - $discount + $shipping + $tax;

        $address = [
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'line_1' => fake()->streetAddress(),
            'line_2' => null,
            'city' => fake()->city(),
            'state' => 'Metro Manila',
            'postal_code' => fake()->numerify('####'),
            'country_code' => 'PH',
            'phone' => fake()->numerify('09#########'),
        ];

        return [
            'user_id' => User::factory(),
            'guest_email' => null,
            'order_number' => 'AA-' . strtoupper(fake()->unique()->bothify('######')),
            'status' => fake()->randomElement(['pending', 'awaiting_payment', 'paid', 'processing', 'shipped', 'delivered']),
            'shipping_address' => $address,
            'billing_address' => $address,
            'coupon_id' => null,
            'subtotal_cents' => $subtotal,
            'discount_cents' => $discount,
            'shipping_cents' => $shipping,
            'tax_cents' => $tax,
            'total_cents' => $total,
            'currency' => 'PHP',
            'customer_notes' => null,
            'admin_notes' => null,
            'shipped_at' => null,
            'delivered_at' => null,
            'cancelled_at' => null,
        ];
    }

    public function guest(): static
    {
        return $this->state(fn () => [
            'user_id' => null,
            'guest_email' => fake()->safeEmail(),
        ]);
    }

    public function delivered(): static
    {
        return $this->state(fn () => [
            'status' => 'delivered',
            'shipped_at' => now()->subDays(5),
            'delivered_at' => now()->subDays(2),
        ]);
    }

    public function cancelled(): static
    {
        return $this->state(fn () => [
            'status' => 'cancelled',
            'cancelled_at' => now()->subDay(),
        ]);
    }
}
