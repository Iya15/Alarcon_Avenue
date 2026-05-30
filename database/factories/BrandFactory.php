<?php

namespace Database\Factories;

use App\Models\Brand;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<Brand> */
class BrandFactory extends Factory
{
    public function definition(): array
    {
        $name = fake()->unique()->company();

        return [
            'name'        => $name,
            'slug'        => Str::slug($name),
            'description' => fake()->optional()->sentence(),
            'logo_path'   => null,
            'website'     => fake()->optional()->url(),
            'is_active'   => true,
            'sort_order'  => fake()->numberBetween(0, 99),
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['is_active' => false]);
    }
}
