<?php

namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<Product> */
class ProductFactory extends Factory
{
    public function definition(): array
    {
        $name = fake()->unique()->words(fake()->numberBetween(2, 5), true);
        $basePrice = fake()->numberBetween(5000, 500000);

        return [
            'brand_id' => null,
            'name' => ucwords($name),
            'slug' => Str::slug($name) . '-' . fake()->unique()->numberBetween(1, 99999),
            'description' => fake()->paragraphs(3, true),
            'short_description' => fake()->sentence(15),
            'base_price_cents' => $basePrice,
            'compare_at_price_cents' => fake()->optional(0.4)->numberBetween($basePrice, $basePrice * 2),
            'cost_price_cents' => fake()->optional(0.6)->numberBetween((int) ($basePrice * 0.3), $basePrice),
            'status' => 'active',
            'is_featured' => fake()->boolean(15),
            'rating_average' => null,
            'review_count' => 0,
            'meta_title' => null,
            'meta_description' => null,
        ];
    }

    public function draft(): static
    {
        return $this->state(fn () => ['status' => 'draft']);
    }

    public function archived(): static
    {
        return $this->state(fn () => ['status' => 'archived']);
    }

    public function featured(): static
    {
        return $this->state(fn () => ['is_featured' => true]);
    }
}
