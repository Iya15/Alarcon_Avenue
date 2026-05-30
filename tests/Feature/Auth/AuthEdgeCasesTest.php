<?php

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);
});

// ── Duplicate email registration ──────────────────────────────────────────────

test('registration rejects a duplicate email with 422', function () {
    User::factory()->create(['email' => 'taken@example.com']);

    $this->post('/register', [
        'name'                  => 'Another',
        'email'                 => 'taken@example.com',
        'password'              => 'password123',
        'password_confirmation' => 'password123',
    ])->assertSessionHasErrors('email');
});

// ── Password reset token reuse ────────────────────────────────────────────────

test('password reset token cannot be reused after successful reset', function () {
    Notification::fake();

    $user = User::factory()->create(['password' => Hash::make('old-password')]);

    // Request a reset link
    $this->post('/forgot-password', ['email' => $user->email]);

    // Capture the token
    $token = null;
    Notification::assertSentTo($user, ResetPassword::class, function ($notification) use (&$token) {
        $token = $notification->token;
        return true;
    });

    // First reset — should succeed
    $this->post('/reset-password', [
        'token'                 => $token,
        'email'                 => $user->email,
        'password'              => 'new-password-123',
        'password_confirmation' => 'new-password-123',
    ])->assertSessionHasNoErrors()->assertRedirect(route('login'));

    // Second reset with the same token — must fail
    $response = $this->post('/reset-password', [
        'token'                 => $token,
        'email'                 => $user->email,
        'password'              => 'another-password',
        'password_confirmation' => 'another-password',
    ]);

    // The second attempt should error (token already consumed)
    $response->assertSessionHasErrors();
    // Verify the second password was NOT applied
    expect(Hash::check('another-password', $user->fresh()->password))->toBeFalse();
});

// ── Password reset with invalid token ────────────────────────────────────────

test('password reset fails with an invalid token', function () {
    $user = User::factory()->create();

    $this->post('/reset-password', [
        'token'                 => 'totally-invalid-token',
        'email'                 => $user->email,
        'password'              => 'new-password',
        'password_confirmation' => 'new-password',
    ])->assertSessionHasErrors();
});

// ── Email verification gate ───────────────────────────────────────────────────

test('unverified user is blocked from verified-only routes', function () {
    $user = User::factory()->create(['email_verified_at' => null]);
    $user->assignRole('customer');

    // /account/orders requires verified email
    $this->actingAs($user)
        ->get(route('account.orders.index'))
        ->assertRedirect(route('verification.notice'));
});

test('verified user can access verified-only routes', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('customer');

    $this->actingAs($user)
        ->get(route('account.orders.index'))
        ->assertOk();
});

// ── Login: wrong password ─────────────────────────────────────────────────────

test('login fails with wrong password and does not authenticate', function () {
    $user = User::factory()->create(['password' => Hash::make('correct-password')]);
    $user->assignRole('customer');

    $this->post('/login', ['email' => $user->email, 'password' => 'wrong-password'])
        ->assertSessionHasErrors('email');

    $this->assertGuest();
});

// ── Login: non-existent email ─────────────────────────────────────────────────

test('login fails gracefully for non-existent email', function () {
    $this->post('/login', ['email' => 'nobody@nowhere.com', 'password' => 'password'])
        ->assertSessionHasErrors('email');

    $this->assertGuest();
});
