<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<OrderItem> */
class OrderItemFactory extends Factory
{
    public function definition(): array
    {
        $unitPrice = fake()->numberBetween(5000, 200000);
        $quantity = fake()->numberBetween(1, 5);

        return [
            'order_id' => Order::factory(),
            'product_id' => Product::factory(),
            'product_variant_id' => ProductVariant::factory(),
            'product_name' => fake()->words(3, true),
            'variant_label' => fake()->optional()->randomElement(['Red / M', 'Blue / L', 'Black / XL', 'White / S']),
            'sku' => strtoupper(fake()->bothify('??-####')),
            'unit_price_cents' => $unitPrice,
            'quantity' => $quantity,
            'subtotal_cents' => $unitPrice * $quantity,
        ];
    }
}
