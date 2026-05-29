<?php

use App\Models\User;
use App\Models\Wishlist;
use Laravel\Socialite\Contracts\Factory as SocialiteFactory;
use Laravel\Socialite\Contracts\Provider;
use Laravel\Socialite\Two\User as SocialiteUser;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);
});

function fakeSocialiteUser(string $id, string $name, string $email, ?string $avatar = null): SocialiteUser
{
    $mock = Mockery::mock(SocialiteUser::class);
    $mock->allows('getId')->andReturn($id);
    $mock->allows('getName')->andReturn($name);
    $mock->allows('getNickname')->andReturn(null);
    $mock->allows('getEmail')->andReturn($email);
    $mock->allows('getAvatar')->andReturn($avatar ?? 'https://example.com/avatar.jpg');

    return $mock;
}

function mockSocialite(SocialiteUser $socialUser): void
{
    $provider = Mockery::mock(Provider::class);
    $provider->allows('user')->andReturn($socialUser);

    $socialite = Mockery::mock(SocialiteFactory::class);
    $socialite->allows('driver')->with('google')->andReturn($provider);

    app()->instance(SocialiteFactory::class, $socialite);
}

test('new user via google oauth gets customer role and default wishlist', function () {
    $socialUser = fakeSocialiteUser('google-id-123', 'Maria Santos', 'maria@gmail.com');
    mockSocialite($socialUser);

    $response = $this->get('/auth/google/callback');

    $response->assertRedirect('/');
    $this->assertAuthenticated();

    $user = User::where('email', 'maria@gmail.com')->firstOrFail();

    expect($user->hasRole('customer'))->toBeTrue();
    expect($user->social_provider)->toBe('google');
    expect($user->social_id)->toBe('google-id-123');
    expect($user->email_verified_at)->not->toBeNull();
    expect(Wishlist::where('user_id', $user->id)->count())->toBe(1);
});

test('existing user with same email gets social account linked', function () {
    $existing = User::factory()->create(['email' => 'existing@gmail.com']);
    $existing->assignRole('customer');

    $socialUser = fakeSocialiteUser('google-id-456', 'Existing User', 'existing@gmail.com');
    mockSocialite($socialUser);

    $this->get('/auth/google/callback');

    $existing->refresh();

    expect($existing->social_provider)->toBe('google');
    expect($existing->social_id)->toBe('google-id-456');

    expect(User::where('email', 'existing@gmail.com')->count())->toBe(1);
});

test('already linked google user can log in without creating duplicate', function () {
    $user = User::factory()->create([
        'email'           => 'linked@gmail.com',
        'social_provider' => 'google',
        'social_id'       => 'google-id-789',
    ]);
    $user->assignRole('customer');

    $socialUser = fakeSocialiteUser('google-id-789', 'Linked User', 'linked@gmail.com');
    mockSocialite($socialUser);

    $this->get('/auth/google/callback');

    $this->assertAuthenticatedAs($user);
    expect(User::where('email', 'linked@gmail.com')->count())->toBe(1);
});

test('inactive user is blocked at oauth callback', function () {
    $user = User::factory()->create([
        'email'           => 'inactive@gmail.com',
        'social_provider' => 'google',
        'social_id'       => 'google-id-000',
        'is_active'       => false,
    ]);

    $socialUser = fakeSocialiteUser('google-id-000', 'Inactive User', 'inactive@gmail.com');
    mockSocialite($socialUser);

    $response = $this->get('/auth/google/callback');

    $this->assertGuest();
    $response->assertRedirect(route('login'));
});

test('unsupported oauth provider returns 404', function () {
    $response = $this->get('/auth/facebook/callback');
    $response->assertStatus(404);
});
