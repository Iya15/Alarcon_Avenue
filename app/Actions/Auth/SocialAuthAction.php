<?php

namespace App\Actions\Auth;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Contracts\User as SocialUser;

class SocialAuthAction
{
    public function execute(string $provider, SocialUser $socialUser): User
    {
        // 1. Already linked to this social account
        $user = User::where('social_provider', $provider)
            ->where('social_id', $socialUser->getId())
            ->first();

        if ($user) {
            return $user;
        }

        // 2. Email exists — link the social account to the existing user
        $user = User::where('email', $socialUser->getEmail())->first();

        if ($user) {
            $user->update([
                'social_provider' => $provider,
                'social_id'       => (string) $socialUser->getId(),
                'social_avatar'   => $socialUser->getAvatar(),
            ]);

            return $user;
        }

        // 3. Brand-new user via social login
        $user = User::create([
            'name'            => $socialUser->getName() ?? $socialUser->getNickname() ?? 'User',
            'email'           => $socialUser->getEmail(),
            'password'        => Hash::make(Str::random(40)),
            'is_active'       => true,
            'social_provider' => $provider,
            'social_id'       => (string) $socialUser->getId(),
            'social_avatar'   => $socialUser->getAvatar(),
        ]);

        // Social login implies a verified email — bypass fillable guard
        $user->markEmailAsVerified();

        $user->assignRole('customer');

        $user->wishlists()->create(['name' => 'My Wishlist']);

        return $user;
    }
}
