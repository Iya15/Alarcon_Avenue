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
            'user_id'            => User::factory(),
            'product_id'         => Product::factory(),
            'order_item_id'      => null,
            'rating'             => fake()->numberBetween(1, 5),
            'title'              => fake()->optional()->sentence(5),
            'body'               => fake()->optional()->paragraph(),
            'status'             => Review::STATUS_PENDING,
            'verified_purchase'  => false,
            'rejection_reason'   => null,
            'helpful_count'      => 0,
        ];
    }

    public function published(): static
    {
        return $this->state(fn () => ['status' => Review::STATUS_PUBLISHED]);
    }

    public function pending(): static
    {
        return $this->state(fn () => ['status' => Review::STATUS_PENDING]);
    }

    public function rejected(string $reason = 'Does not meet guidelines.'): static
    {
        return $this->state(fn () => ['status' => Review::STATUS_REJECTED, 'rejection_reason' => $reason]);
    }

    public function verified(): static
    {
        return $this->state(fn () => ['verified_purchase' => true]);
    }

    public function fiveStar(): static
    {
        return $this->state(fn () => ['rating' => 5]);
    }
}
