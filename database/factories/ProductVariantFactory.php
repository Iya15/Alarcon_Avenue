<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<ProductVariant> */
class ProductVariantFactory extends Factory
{
    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'sku' => strtoupper(Str::random(4)) . '-' . fake()->unique()->numberBetween(1000, 99999),
            'price_override_cents' => null,
            'compare_at_price_cents' => null,
            'cost_price_cents' => null,
            'weight_grams' => fake()->optional()->numberBetween(100, 5000),
            'is_active' => true,
        ];
    }

    public function withPriceOverride(int $cents): static
    {
        return $this->state(fn () => ['price_override_cents' => $cents]);
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['is_active' => false]);
    }
}
