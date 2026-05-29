<?php

namespace Database\Factories;

use App\Models\Inventory;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Inventory> */
class InventoryFactory extends Factory
{
    public function definition(): array
    {
        $quantity = fake()->numberBetween(0, 500);

        return [
            'product_variant_id' => ProductVariant::factory(),
            'quantity' => $quantity,
            'reserved_quantity' => fake()->numberBetween(0, min(10, $quantity)),
            'low_stock_threshold' => fake()->optional(0.5)->numberBetween(3, 20),
        ];
    }

    public function outOfStock(): static
    {
        return $this->state(fn () => ['quantity' => 0, 'reserved_quantity' => 0]);
    }

    public function inStock(int $qty = 100): static
    {
        return $this->state(fn () => ['quantity' => $qty, 'reserved_quantity' => 0]);
    }
}
