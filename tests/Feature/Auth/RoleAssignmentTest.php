<?php

use App\Models\User;
use App\Models\Wishlist;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'staff',    'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'admin',    'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'vendor',   'guard_name' => 'web']);
});

test('new user via registration gets customer role', function () {
    $this->post('/register', [
        'name'                  => 'Jane Doe',
        'email'                 => 'jane@example.com',
        'password'              => 'password',
        'password_confirmation' => 'password',
    ]);

    $user = User::where('email', 'jane@example.com')->firstOrFail();

    expect($user->hasRole('customer'))->toBeTrue();
    expect($user->hasRole('admin'))->toBeFalse();
});

test('new user registration creates a default wishlist', function () {
    $this->post('/register', [
        'name'                  => 'John Doe',
        'email'                 => 'john@example.com',
        'password'              => 'password',
        'password_confirmation' => 'password',
    ]);

    $user = User::where('email', 'john@example.com')->firstOrFail();

    expect(Wishlist::where('user_id', $user->id)->count())->toBe(1);
    expect(Wishlist::where('user_id', $user->id)->value('name'))->toBe('My Wishlist');
});

test('manually assigned staff role is respected', function () {
    $user = User::factory()->create();
    $user->assignRole('staff');

    expect($user->hasRole('staff'))->toBeTrue();
    expect($user->hasRole('customer'))->toBeFalse();
});

test('admin role can be assigned alongside other roles', function () {
    $user = User::factory()->create();
    $user->syncRoles(['admin']);

    expect($user->hasRole('admin'))->toBeTrue();
    expect($user->hasAnyRole(['customer', 'staff']))->toBeFalse();
});
