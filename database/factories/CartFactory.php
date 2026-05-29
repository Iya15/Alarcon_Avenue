<?php

namespace Database\Factories;

use App\Models\Cart;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<Cart> */
class CartFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => null,
            'session_id' => Str::random(40),
            'coupon_id' => null,
        ];
    }

    public function forUser(User $user): static
    {
        return $this->state(fn () => [
            'user_id' => $user->id,
            'session_id' => null,
        ]);
    }
}
