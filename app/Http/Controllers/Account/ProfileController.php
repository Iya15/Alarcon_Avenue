<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Http\Requests\Account\UpdatePasswordRequest;
use App\Http\Requests\Account\UpdateProfileRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('Account/Profile', [
            'user'            => [
                'name'              => $user->name,
                'email'             => $user->email,
                'phone'             => $user->phone,
                'avatar_url'        => $user->avatar_path
                    ? Storage::disk('media')->url($user->avatar_path)
                    : null,
                'email_verified'    => $user->hasVerifiedEmail(),
                'is_social_auth'    => $user->isSocialAuth(),
            ],
            'status' => session('status'),
        ]);
    }

    public function update(UpdateProfileRequest $request): RedirectResponse
    {
        $user = $request->user();
        $data = $request->safe()->except('avatar');

        if ($request->hasFile('avatar')) {
            if ($user->avatar_path) {
                Storage::disk('media')->delete($user->avatar_path);
            }
            $data['avatar_path'] = $request->file('avatar')->store('avatars', 'media');
        }

        $emailChanged = isset($data['email']) && $data['email'] !== $user->email;

        $user->update($data);

        if ($emailChanged) {
            // forceFill bypasses $fillable so we can null the verified timestamp
            $user->forceFill(['email_verified_at' => null])->save();
            $user->sendEmailVerificationNotification();
        }

        return back()->with('status', 'profile-updated');
    }

    public function updatePassword(UpdatePasswordRequest $request): RedirectResponse
    {
        $request->user()->update([
            'password' => Hash::make($request->validated()['password']),
        ]);

        return back()->with('status', 'password-updated');
    }
}
