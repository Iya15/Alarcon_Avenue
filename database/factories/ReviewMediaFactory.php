<?php

namespace Database\Factories;

use App\Models\Review;
use App\Models\ReviewMedia;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<ReviewMedia> */
class ReviewMediaFactory extends Factory
{
    public function definition(): array
    {
        return [
            'review_id' => Review::factory(),
            'path' => 'reviews/' . fake()->uuid() . '.jpg',
            'type' => 'image',
            'sort_order' => fake()->numberBetween(0, 5),
        ];
    }

    public function video(): static
    {
        return $this->state(fn () => [
            'path' => 'reviews/' . fake()->uuid() . '.mp4',
            'type' => 'video',
        ]);
    }
}
