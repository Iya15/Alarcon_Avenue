<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<ProductImage> */
class ProductImageFactory extends Factory
{
    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'product_variant_id' => null,
            'path' => 'products/' . fake()->uuid() . '.jpg',
            'alt_text' => fake()->optional()->sentence(4),
            'sort_order' => fake()->numberBetween(0, 10),
            'is_primary' => false,
        ];
    }

    public function primary(): static
    {
        return $this->state(fn () => ['is_primary' => true, 'sort_order' => 0]);
    }
}
