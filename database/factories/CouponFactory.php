<?php

namespace Database\Factories;

use App\Models\Coupon;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<Coupon> */
class CouponFactory extends Factory
{
    public function definition(): array
    {
        return [
            'code' => strtoupper(Str::random(8)),
            'discount_type' => fake()->randomElement(['percentage', 'fixed_cents', 'free_shipping']),
            'discount_value' => fake()->numberBetween(5, 50),
            'min_order_cents' => fake()->optional()->numberBetween(10000, 100000),
            'max_uses' => fake()->optional()->numberBetween(10, 500),
            'max_uses_per_user' => fake()->optional()->numberBetween(1, 3),
            'used_count' => 0,
            'starts_at' => null,
            'expires_at' => fake()->optional(0.6)->dateTimeBetween('+1 week', '+6 months'),
            'is_active' => true,
        ];
    }

    public function percentage(int $percent): static
    {
        return $this->state(fn () => [
            'discount_type' => 'percentage',
            'discount_value' => $percent,
        ]);
    }

    public function fixedCents(int $cents): static
    {
        return $this->state(fn () => [
            'discount_type' => 'fixed_cents',
            'discount_value' => $cents,
        ]);
    }

    public function expired(): static
    {
        return $this->state(fn () => [
            'expires_at' => now()->subDay(),
        ]);
    }
}
