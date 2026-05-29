<?php

namespace Database\Factories;

use App\Models\Attribute;
use App\Models\AttributeValue;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<AttributeValue> */
class AttributeValueFactory extends Factory
{
    public function definition(): array
    {
        $value = fake()->unique()->word();

        return [
            'attribute_id' => Attribute::factory(),
            'value' => strtolower($value),
            'display_value' => ucfirst($value),
            'meta' => null,
            'sort_order' => fake()->numberBetween(0, 20),
        ];
    }

    public function color(string $name, string $hex): static
    {
        return $this->state(fn () => [
            'value' => strtolower($name),
            'display_value' => $name,
            'meta' => ['hex' => $hex],
        ]);
    }
}
