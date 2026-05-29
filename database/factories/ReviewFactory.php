<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Review> */
class ReviewFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'product_id' => Product::factory(),
            'order_item_id' => null,
            'rating' => fake()->numberBetween(1, 5),
            'title' => fake()->optional()->sentence(5),
            'body' => fake()->optional()->paragraph(),
            'is_approved' => false,
            'helpful_count' => 0,
        ];
    }

    public function approved(): static
    {
        return $this->state(fn () => ['is_approved' => true]);
    }

    public function fiveStar(): static
    {
        return $this->state(fn () => ['rating' => 5]);
    }
}
