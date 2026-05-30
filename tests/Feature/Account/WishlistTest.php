<?php

use App\Models\User;
use App\Models\Product;
use App\Models\Wishlist;
use App\Models\WishlistItem;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);
});

// ── View wishlist ─────────────────────────────────────────────────────────────

test('authenticated user can view their wishlist page', function () {
    $user = User::factory()->create();
    $user->assignRole('customer');

    $wishlist = Wishlist::factory()->create(['user_id' => $user->id]);
    $product  = Product::factory()->create(['status' => 'active']);
    WishlistItem::factory()->create(['wishlist_id' => $wishlist->id, 'product_id' => $product->id]);

    $this->actingAs($user)
        ->get(route('account.wishlist'))
        ->assertOk()
        ->assertInertia(fn ($p) => $p
            ->component('Account/Wishlist')
            ->has('items', 1)
            ->where('wishlistId', $wishlist->id)
        );
});

test('guest is redirected from wishlist page', function () {
    $this->get(route('account.wishlist'))->assertRedirect(route('login'));
});

test('wishlist page returns empty items for user with no wishlist', function () {
    $user = User::factory()->create();
    $user->assignRole('customer');

    $this->actingAs($user)
        ->get(route('account.wishlist'))
        ->assertOk()
        ->assertInertia(fn ($p) => $p->where('items', []));
});

// ── Remove wishlist item ──────────────────────────────────────────────────────

test('user can remove their own wishlist item', function () {
    $user     = User::factory()->create();
    $user->assignRole('customer');
    $wishlist = Wishlist::factory()->create(['user_id' => $user->id]);
    $item     = WishlistItem::factory()->create(['wishlist_id' => $wishlist->id]);

    $this->actingAs($user)
        ->delete(route('account.wishlist.destroy', $item))
        ->assertRedirect();

    $this->assertDatabaseMissing('wishlist_items', ['id' => $item->id]);
});

test('user cannot remove another users wishlist item', function () {
    $owner    = User::factory()->create();
    $attacker = User::factory()->create();
    $wishlist = Wishlist::factory()->create(['user_id' => $owner->id]);
    $item     = WishlistItem::factory()->create(['wishlist_id' => $wishlist->id]);

    $this->actingAs($attacker)
        ->delete(route('account.wishlist.destroy', $item))
        ->assertForbidden();

    $this->assertDatabaseHas('wishlist_items', ['id' => $item->id]);
});

// ── Wishlist created on standard registration ─────────────────────────────────

test('wishlist is created when a new user registers', function () {
    $this->post('/register', [
        'name'                  => 'Wishlist Tester',
        'email'                 => 'wishlist@test.com',
        'password'              => 'password123',
        'password_confirmation' => 'password123',
    ]);

    $user = \App\Models\User::where('email', 'wishlist@test.com')->first();

    expect($user)->not->toBeNull();
    expect($user->wishlists()->exists())->toBeTrue();
});
