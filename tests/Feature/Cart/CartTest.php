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

function makeStockedVariant(int $stock = 10, int $price = 99900): array
{
    $product = Product::factory()->create([
        'name'             => 'Test Product',
        'base_price_cents' => $price,
        'status'           => 'active',
        'is_featured'      => false,
    ]);
    $variant = ProductVariant::factory()->create([
        'product_id' => $product->id,
        'sku'        => 'TEST-' . uniqid(),
        'is_active'  => true,
    ]);
    Inventory::create([
        'product_variant_id' => $variant->id,
        'quantity'           => $stock,
        'reserved_quantity'  => 0,
    ]);
    return ['product' => $product, 'variant' => $variant];
}

// ── Guest cart ─────────────────────────────────────────────────────────────────

test('guest can fetch an empty cart', function () {
    $this->get('/api/cart')
        ->assertOk()
        ->assertJsonPath('totals.items_count', 0);
});

test('guest can add item to cart', function () {
    ['variant' => $variant] = makeStockedVariant();

    $this->post('/api/cart/items', ['variant_id' => $variant->id, 'quantity' => 2])
        ->assertOk()
        ->assertJsonPath('items.0.quantity', 2)
        ->assertJsonPath('totals.items_count', 2);
});

test('adding the same variant again increases quantity', function () {
    ['variant' => $variant] = makeStockedVariant();

    // Use an authenticated user so cart resolves by user_id (persistent across requests)
    $user = User::factory()->create();
    $user->assignRole('customer');
    $this->actingAs($user);

    $this->post('/api/cart/items', ['variant_id' => $variant->id, 'quantity' => 2]);
    $response = $this->post('/api/cart/items', ['variant_id' => $variant->id, 'quantity' => 3]);

    $response->assertOk()->assertJsonPath('items.0.quantity', 5);
});

test('quantity is capped at available stock', function () {
    ['variant' => $variant] = makeStockedVariant(stock: 3);

    $this->post('/api/cart/items', ['variant_id' => $variant->id, 'quantity' => 10])
        ->assertOk()
        ->assertJsonPath('items.0.quantity', 3);
});

test('out-of-stock variant cannot be added', function () {
    ['variant' => $variant] = makeStockedVariant(stock: 0);

    $this->post('/api/cart/items', ['variant_id' => $variant->id, 'quantity' => 1])
        ->assertStatus(422);
});

test('draft product cannot be added to cart', function () {
    $product = Product::factory()->draft()->create(['name' => 'Draft', 'is_featured' => false]);
    $variant = ProductVariant::factory()->create(['product_id' => $product->id, 'sku' => 'DRF-001', 'is_active' => true]);
    Inventory::create(['product_variant_id' => $variant->id, 'quantity' => 5, 'reserved_quantity' => 0]);

    $this->post('/api/cart/items', ['variant_id' => $variant->id, 'quantity' => 1])
        ->assertStatus(422);
});

// ── Update & remove ────────────────────────────────────────────────────────────

test('can update cart item quantity', function () {
    $user = User::factory()->create();
    $user->assignRole('customer');
    $this->actingAs($user);

    ['variant' => $variant] = makeStockedVariant();
    $addResponse = $this->post('/api/cart/items', ['variant_id' => $variant->id, 'quantity' => 2]);
    $itemId = $addResponse->json('items.0.id');

    $this->patch("/api/cart/items/{$itemId}", ['quantity' => 4])
        ->assertOk()
        ->assertJsonPath('items.0.quantity', 4);
});

test('can remove a cart item', function () {
    $user = User::factory()->create();
    $user->assignRole('customer');
    $this->actingAs($user);

    ['variant' => $variant] = makeStockedVariant();
    $addResponse = $this->post('/api/cart/items', ['variant_id' => $variant->id, 'quantity' => 1]);
    $itemId = $addResponse->json('items.0.id');

    $this->delete("/api/cart/items/{$itemId}")
        ->assertOk()
        ->assertJsonPath('totals.items_count', 0);
});

// ── Save for later ────────────────────────────────────────────────────────────

test('saving for later removes item from active totals', function () {
    $user = User::factory()->create();
    $user->assignRole('customer');
    $this->actingAs($user);

    ['variant' => $v1] = makeStockedVariant(price: 50000);
    ['variant' => $v2] = makeStockedVariant(price: 30000);

    $this->post('/api/cart/items', ['variant_id' => $v1->id, 'quantity' => 1]);
    $addResponse = $this->post('/api/cart/items', ['variant_id' => $v2->id, 'quantity' => 1]);

    $item2Id = $addResponse->json('items.1.id');

    $response = $this->patch("/api/cart/items/{$item2Id}/save")->assertOk();

    expect($response->json('totals.subtotal_cents'))->toBe(50000);
    expect($response->json('saved_items'))->toHaveCount(1);
    expect($response->json('items'))->toHaveCount(1);
});

test('moving saved item back to cart restores it to totals', function () {
    $user = User::factory()->create();
    $user->assignRole('customer');
    $this->actingAs($user);

    ['variant' => $variant] = makeStockedVariant(price: 50000);
    $addResponse = $this->post('/api/cart/items', ['variant_id' => $variant->id, 'quantity' => 1]);
    $itemId = $addResponse->json('items.0.id');

    $this->patch("/api/cart/items/{$itemId}/save");
    $response = $this->patch("/api/cart/items/{$itemId}/save");

    expect($response->json('totals.subtotal_cents'))->toBe(50000);
    expect($response->json('saved_items'))->toHaveCount(0);
});

// ── Server-authoritative totals ───────────────────────────────────────────────

test('totals are computed server-side and include VAT extraction', function () {
    ['variant' => $variant] = makeStockedVariant(price: 112_00); // ₱112.00 VAT-inclusive

    $response = $this->post('/api/cart/items', ['variant_id' => $variant->id, 'quantity' => 1])
        ->assertOk();

    $subtotal = $response->json('totals.subtotal_cents');
    $tax      = $response->json('totals.tax_cents');

    expect($subtotal)->toBe(11200);
    // VAT = 11200 × 12/112 = 1200 cents = ₱12.00
    expect($tax)->toBe(1200);
});

test('shipping is free above the 150000 cent threshold', function () {
    ['variant' => $variant] = makeStockedVariant(price: 200_000); // ₱2,000 above threshold

    $response = $this->post('/api/cart/items', ['variant_id' => $variant->id, 'quantity' => 1]);

    expect($response->json('totals.shipping_cents'))->toBe(0);
    expect($response->json('totals.free_shipping_applied'))->toBeTrue();
});

test('shipping is ₱150 below the threshold', function () {
    ['variant' => $variant] = makeStockedVariant(price: 50_000); // ₱500 below threshold

    $response = $this->post('/api/cart/items', ['variant_id' => $variant->id, 'quantity' => 1]);

    expect($response->json('totals.shipping_cents'))->toBe(15_000);
});

// ── Item ownership ────────────────────────────────────────────────────────────

test('user cannot modify another user cart item', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();
    $user1->assignRole('customer');
    $user2->assignRole('customer');

    ['variant' => $variant] = makeStockedVariant();

    $addResponse = $this->actingAs($user1)->post('/api/cart/items', ['variant_id' => $variant->id, 'quantity' => 1]);
    $itemId = $addResponse->json('items.0.id');

    $this->actingAs($user2)->delete("/api/cart/items/{$itemId}")->assertForbidden();
});
