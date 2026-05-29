<?php

namespace App\Actions\Auth;

use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Hash;

class RegisterUserAction
{
    public function execute(array $data): User
    {
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
        ]);

        $user->assignRole('customer');

        $user->wishlists()->create(['name' => 'My Wishlist']);

        event(new Registered($user));

        return $user;
    }
}
