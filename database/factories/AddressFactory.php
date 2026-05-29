<?php

namespace Database\Factories;

use App\Models\Address;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Address> */
class AddressFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'label' => fake()->optional()->randomElement(['Home', 'Work', 'Other']),
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'company' => fake()->optional()->company(),
            'line_1' => fake()->streetAddress(),
            'line_2' => fake()->optional()->secondaryAddress(),
            'city' => fake()->city(),
            'state' => fake()->randomElement([
                'Metro Manila', 'Cebu', 'Davao', 'Laguna', 'Cavite',
                'Rizal', 'Bulacan', 'Pampanga', 'Batangas', 'Quezon',
            ]),
            'postal_code' => fake()->numerify('####'),
            'country_code' => 'PH',
            'phone' => fake()->optional()->numerify('09#########'),
            'is_default_shipping' => false,
            'is_default_billing' => false,
        ];
    }

    public function defaultShipping(): static
    {
        return $this->state(fn () => ['is_default_shipping' => true]);
    }

    public function defaultBilling(): static
    {
        return $this->state(fn () => ['is_default_billing' => true]);
    }
}
