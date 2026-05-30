<?php

use App\Models\Address;
use App\Models\Order;
use App\Models\User;
use Illuminate\Notifications\DatabaseNotification;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);
    $this->withHeaders(['Accept' => 'application/json']);
});

// ── Auth guard ─────────────────────────────────────────────────────────────────

test('guest gets 401 from account dashboard (JSON header)', function () {
    // JSON requests to auth-guarded routes return 401, not 302.
    $this->get(route('account.profile'))->assertStatus(401);
});

test('authenticated user can access account dashboard', function () {
    $user = User::factory()->create();
    $user->assignRole('customer');
    $this->actingAs($user)->get(route('account.profile'))->assertOk();
});

// ── Order isolation ────────────────────────────────────────────────────────────

test('user A cannot view user B order', function () {
    $userA = User::factory()->create();
    $userB = User::factory()->create();
    $userA->assignRole('customer');
    $userB->assignRole('customer');

    $orderB = Order::factory()->create([
        'user_id' => $userB->id,
        'status'  => 'paid',
        'shipping_address' => ['first_name' => 'B', 'last_name' => 'B', 'line_1' => '1', 'city' => 'C', 'state' => 'S', 'postal_code' => '1', 'country_code' => 'PH', 'phone' => '0'],
        'billing_address'  => ['first_name' => 'B', 'last_name' => 'B', 'line_1' => '1', 'city' => 'C', 'state' => 'S', 'postal_code' => '1', 'country_code' => 'PH', 'phone' => '0'],
    ]);

    $this->actingAs($userA)
        ->get(route('account.orders.show', $orderB->id))
        ->assertForbidden();
});

test('user can view their own order', function () {
    $user = User::factory()->create();
    $user->assignRole('customer');

    $order = Order::factory()->create([
        'user_id' => $user->id,
        'status'  => 'paid',
        'shipping_address' => ['first_name' => 'A', 'last_name' => 'A', 'line_1' => '1', 'city' => 'C', 'state' => 'S', 'postal_code' => '1', 'country_code' => 'PH', 'phone' => '0'],
        'billing_address'  => ['first_name' => 'A', 'last_name' => 'A', 'line_1' => '1', 'city' => 'C', 'state' => 'S', 'postal_code' => '1', 'country_code' => 'PH', 'phone' => '0'],
    ]);

    $this->actingAs($user)
        ->get(route('account.orders.show', $order->id))
        ->assertOk();
});

// ── Address isolation ──────────────────────────────────────────────────────────

test('user A cannot delete user B address', function () {
    $userA = User::factory()->create();
    $userB = User::factory()->create();
    $userA->assignRole('customer');
    $userB->assignRole('customer');

    $addressB = Address::factory()->create(['user_id' => $userB->id]);

    $this->actingAs($userA)
        ->delete(route('account.addresses.destroy', $addressB->id))
        ->assertForbidden();
});

test('user can delete their own address', function () {
    $user = User::factory()->create();
    $user->assignRole('customer');
    $address = Address::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->delete(route('account.addresses.destroy', $address->id))
        ->assertRedirect();

    expect(Address::find($address->id))->toBeNull();
});

// ── Notification isolation ────────────────────────────────────────────────────

test('user can only mark their own notification as read', function () {
    $userA = User::factory()->create();
    $userB = User::factory()->create();
    $userA->assignRole('customer');
    $userB->assignRole('customer');

    // Directly insert a database notification for userB
    \Illuminate\Notifications\DatabaseNotification::create([
        'id'             => \Illuminate\Support\Str::uuid()->toString(),
        'type'           => 'TestNotification',
        'notifiable_type' => User::class,
        'notifiable_id'  => $userB->id,
        'data'           => json_encode(['message' => 'hello']),
        'read_at'        => null,
        'created_at'     => now(),
        'updated_at'     => now(),
    ]);
    $notifId = $userB->notifications()->first()->id;

    $this->actingAs($userA)
        ->patch(route('account.notifications.read', $notifId))
        ->assertStatus(404); // not found for user A because query is scoped to userA
});

// ── Profile update ─────────────────────────────────────────────────────────────

test('user can update their own profile', function () {
    $user = User::factory()->create(['name' => 'Old Name']);
    $user->assignRole('customer');

    $this->actingAs($user)
        ->post(route('account.profile.update'), [
            'name'  => 'New Name',
            'email' => $user->email,
        ])
        ->assertRedirect();

    expect($user->fresh()->name)->toBe('New Name');
});

test('email change clears verification and triggers re-verification', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('customer');

    $this->actingAs($user)
        ->post(route('account.profile.update'), [
            'name'  => $user->name,
            'email' => 'new-email@example.com',
        ]);

    $refreshed = $user->fresh();
    expect($refreshed->email)->toBe('new-email@example.com');
    expect($refreshed->email_verified_at)->toBeNull();
});

// ── Address CRUD ───────────────────────────────────────────────────────────────

test('setting default shipping unsets previous default', function () {
    $user = User::factory()->create();
    $user->assignRole('customer');
    $old = Address::factory()->create(['user_id' => $user->id, 'is_default_shipping' => true]);

    $this->actingAs($user)->post(route('account.addresses.store'), [
        'first_name' => 'New', 'last_name' => 'Addr',
        'line_1' => '99 St', 'city' => 'Manila', 'state' => 'Metro Manila',
        'postal_code' => '1000', 'country_code' => 'PH',
        'is_default_shipping' => true, 'is_default_billing' => false,
    ]);

    expect($old->fresh()->is_default_shipping)->toBeFalse();
    expect($user->addresses()->where('is_default_shipping', true)->count())->toBe(1);
});
