<?php

namespace App\Http\Controllers\Auth;

use App\Actions\Auth\SocialAuthAction;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    private const ALLOWED_PROVIDERS = ['google'];

    public function redirect(string $provider): RedirectResponse
    {
        $this->abortIfUnsupported($provider);

        return Socialite::driver($provider)->redirect();
    }

    public function callback(string $provider, SocialAuthAction $action): RedirectResponse
    {
        $this->abortIfUnsupported($provider);

        try {
            $socialUser = Socialite::driver($provider)->user();
        } catch (\Throwable) {
            return redirect()->route('login')->withErrors([
                'email' => __('Social authentication failed. Please try again.'),
            ]);
        }

        $user = $action->execute($provider, $socialUser);

        if (! $user->is_active) {
            return redirect()->route('login')->withErrors([
                'email' => __('Your account has been disabled.'),
            ]);
        }

        Auth::login($user, remember: true);

        request()->session()->regenerate();

        return redirect('/');
    }

    private function abortIfUnsupported(string $provider): void
    {
        if (! in_array($provider, self::ALLOWED_PROVIDERS, true)) {
            abort(404);
        }
    }
}
