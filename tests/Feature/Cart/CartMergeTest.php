<?php

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Inventory;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);
    $this->withHeaders(['Accept' => 'application/json']);
});

function makeVariantWithStock(int $stock = 10, int $price = 50_000): ProductVariant
{
    $product = Product::factory()->create([
        'name'             => 'Merge Test Product ' . uniqid(),
        'base_price_cents' => $price,
        'status'           => 'active',
        'is_featured'      => false,
    ]);
    $variant = ProductVariant::factory()->create([
        'product_id' => $product->id,
        'sku'        => 'MRG-' . uniqid(),
        'is_active'  => true,
    ]);
    Inventory::create([
        'product_variant_id' => $variant->id,
        'quantity'           => $stock,
        'reserved_quantity'  => 0,
    ]);
    return $variant;
}

test('guest cart items move to user cart on merge', function () {
    $variant = makeVariantWithStock();

    // Guest adds item
    $guestSession = $this->startSession();
    $this->post('/api/cart/items', ['variant_id' => $variant->id, 'quantity' => 2]);

    $guestSessionId = session()->getId();

    // Log in
    $user = User::factory()->create();
    $user->assignRole('customer');

    $response = $this->actingAs($user)->post('/api/cart/merge', ['session_id' => $guestSessionId]);
    $response->assertOk();

    expect($response->json('items'))->toHaveCount(1);
    expect($response->json('items.0.quantity'))->toBe(2);

    // Guest cart should be deleted
    expect(Cart::where('session_id', $guestSessionId)->exists())->toBeFalse();
});

test('quantities combine when same variant exists in both carts', function () {
    $variant = makeVariantWithStock(stock: 10);

    // Build a guest cart
    $guestCart = Cart::create(['session_id' => 'guest-session-123']);
    CartItem::create([
        'cart_id'            => $guestCart->id,
        'product_variant_id' => $variant->id,
        'quantity'           => 3,
        'unit_price_cents'   => 50_000,
        'saved_for_later'    => false,
    ]);

    // Build a user cart with same variant
    $user     = User::factory()->create();
    $user->assignRole('customer');
    $userCart = Cart::create(['user_id' => $user->id]);
    CartItem::create([
        'cart_id'            => $userCart->id,
        'product_variant_id' => $variant->id,
        'quantity'           => 4,
        'unit_price_cents'   => 50_000,
        'saved_for_later'    => false,
    ]);

    $response = $this->actingAs($user)->post('/api/cart/merge', ['session_id' => 'guest-session-123']);
    $response->assertOk();

    // Combined: 3 + 4 = 7, within stock of 10
    expect($response->json('items.0.quantity'))->toBe(7);
});

test('combined quantity is capped at available stock', function () {
    $variant = makeVariantWithStock(stock: 5);

    $guestCart = Cart::create(['session_id' => 'guest-cap-test']);
    CartItem::create([
        'cart_id'            => $guestCart->id,
        'product_variant_id' => $variant->id,
        'quantity'           => 4,
        'unit_price_cents'   => 50_000,
        'saved_for_later'    => false,
    ]);

    $user     = User::factory()->create();
    $user->assignRole('customer');
    $userCart = Cart::create(['user_id' => $user->id]);
    CartItem::create([
        'cart_id'            => $userCart->id,
        'product_variant_id' => $variant->id,
        'quantity'           => 4,
        'unit_price_cents'   => 50_000,
        'saved_for_later'    => false,
    ]);

    $response = $this->actingAs($user)->post('/api/cart/merge', ['session_id' => 'guest-cap-test']);
    $response->assertOk();

    // 4 + 4 = 8, but capped at 5
    expect($response->json('items.0.quantity'))->toBe(5);
});

test('out-of-stock guest items are not transferred', function () {
    $variant = makeVariantWithStock(stock: 0);

    $guestCart = Cart::create(['session_id' => 'guest-oos-test']);
    CartItem::create([
        'cart_id'            => $guestCart->id,
        'product_variant_id' => $variant->id,
        'quantity'           => 2,
        'unit_price_cents'   => 50_000,
        'saved_for_later'    => false,
    ]);

    $user = User::factory()->create();
    $user->assignRole('customer');

    $response = $this->actingAs($user)->post('/api/cart/merge', ['session_id' => 'guest-oos-test']);
    $response->assertOk();

    expect($response->json('items'))->toHaveCount(0);
});

test('merge requires authentication', function () {
    $this->post('/api/cart/merge')->assertStatus(401);
});

test('empty guest cart merge leaves user cart unchanged', function () {
    $variant = makeVariantWithStock();
    $user    = User::factory()->create();
    $user->assignRole('customer');

    $userCart = Cart::create(['user_id' => $user->id]);
    CartItem::create([
        'cart_id'            => $userCart->id,
        'product_variant_id' => $variant->id,
        'quantity'           => 2,
        'unit_price_cents'   => 50_000,
        'saved_for_later'    => false,
    ]);

    $response = $this->actingAs($user)->post('/api/cart/merge', ['session_id' => 'empty-guest-session']);
    $response->assertOk();

    expect($response->json('items.0.quantity'))->toBe(2);
});
