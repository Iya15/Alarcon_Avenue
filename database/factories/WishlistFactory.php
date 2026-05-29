<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\Wishlist;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Wishlist> */
class WishlistFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => fake()->randomElement(['My Wishlist', 'Gift Ideas', 'Favorites', 'Want to Buy']),
            'is_public' => fake()->boolean(20),
        ];
    }
}
