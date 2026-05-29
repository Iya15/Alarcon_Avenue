<?php

namespace Database\Factories;

use App\Models\Attribute;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Attribute> */
class AttributeFactory extends Factory
{
    public function definition(): array
    {
        $name = fake()->unique()->word();

        return [
            'name' => strtolower($name),
            'display_name' => ucfirst($name),
            'type' => fake()->randomElement(['select', 'color_swatch', 'button']),
            'sort_order' => fake()->numberBetween(0, 20),
        ];
    }
}
