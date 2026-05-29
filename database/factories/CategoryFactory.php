<?php

namespace Database\Factories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<Category> */
class CategoryFactory extends Factory
{
    public function definition(): array
    {
        $name = fake()->unique()->words(fake()->numberBetween(1, 3), true);

        return [
            'parent_id' => null,
            'name' => ucwords($name),
            'slug' => Str::slug($name) . '-' . fake()->unique()->numberBetween(1, 9999),
            'description' => fake()->optional()->sentence(),
            'image_path' => null,
            'sort_order' => fake()->numberBetween(0, 99),
            'is_active' => true,
        ];
    }

    public function child(Category $parent): static
    {
        return $this->state(fn () => ['parent_id' => $parent->id]);
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['is_active' => false]);
    }
}
