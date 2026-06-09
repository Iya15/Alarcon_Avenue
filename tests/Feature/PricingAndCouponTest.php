<?php

use App\Http\Resources\ProductDetailResource;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Coupon;
use App\Models\Inventory;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use App\Services\CartTotalsService;
use Spatie\Permission\Models\Role;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeCartWithSubtotal(int $subtotalCents): Cart
{
    $product = Product::factory()->create(['base_price_cents' => $subtotalCents, 'status' => 'active', 'is_featured' => false]);
    $variant = ProductVariant::factory()->create(['product_id' => $product->id, 'is_active' => true]);
    Inventory::create(['product_variant_id' => $variant->id, 'quantity' => 10, 'reserved_quantity' => 0]);

    $cart = Cart::factory()->create();
    CartItem::create([
        'cart_id'            => $cart->id,
        'product_variant_id' => $variant->id,
        'quantity'           => 1,
        'unit_price_cents'   => $subtotalCents,
        'saved_for_later'    => false,
    ]);

    return $cart;
}

// ── Price display ─────────────────────────────────────────────────────────────

test('price_display is formatted as Philippine Peso from cents', function () {
    $product = Product::factory()->create(['base_price_cents' => 29900, 'status' => 'active', 'is_featured' => false]);

    $data = (new ProductDetailResource($product))->resolve();

    expect($data['price_display'])->toBe('₱299.00');
});

test('price_display rounds correctly for even pesos', function () {
    $product = Product::factory()->create(['base_price_cents' => 100000, 'status' => 'active', 'is_featured' => false]);

    $data = (new ProductDetailResource($product))->resolve();

    expect($data['price_display'])->toBe('₱1,000.00');
});

// ── Coupon percentage ─────────────────────────────────────────────────────────

test('percentage coupon gives 20 percent discount on 100000 cent subtotal', function () {
    $cart   = makeCartWithSubtotal(100_000);
    $coupon = Coupon::factory()->percentage(20)->create(['min_order_cents' => null, 'max_uses' => null, 'expires_at' => null]);

    $cart->update(['coupon_id' => $coupon->id]);
    $cart->load(['items', 'coupon']);

    $totals = app(CartTotalsService::class)->compute($cart);

    expect($totals['discount_cents'])->toBe(20_000);
});

// ── Coupon fixed ──────────────────────────────────────────────────────────────

test('fixed coupon gives exact discount when under subtotal', function () {
    $cart   = makeCartWithSubtotal(30_000);
    $coupon = Coupon::factory()->fixedCents(5_000)->create(['min_order_cents' => null, 'max_uses' => null, 'expires_at' => null]);

    $cart->update(['coupon_id' => $coupon->id]);
    $cart->load(['items', 'coupon']);

    $totals = app(CartTotalsService::class)->compute($cart);

    expect($totals['discount_cents'])->toBe(5_000);
});

test('fixed coupon is capped at subtotal when value exceeds it', function () {
    $cart   = makeCartWithSubtotal(30_000);
    $coupon = Coupon::factory()->fixedCents(50_000)->create(['min_order_cents' => null, 'max_uses' => null, 'expires_at' => null]);

    $cart->update(['coupon_id' => $coupon->id]);
    $cart->load(['items', 'coupon']);

    $totals = app(CartTotalsService::class)->compute($cart);

    expect($totals['discount_cents'])->toBe(30_000);
});

// ── Shipping thresholds ───────────────────────────────────────────────────────

test('shipping is free when subtotal equals the 99900 cent threshold', function () {
    $cart = makeCartWithSubtotal(99_900);
    $cart->load(['items', 'coupon']);

    $totals = app(CartTotalsService::class)->compute($cart);

    expect($totals['shipping_cents'])->toBe(0);
});

test('shipping is free when subtotal exceeds the threshold', function () {
    $cart = makeCartWithSubtotal(200_000);
    $cart->load(['items', 'coupon']);

    $totals = app(CartTotalsService::class)->compute($cart);

    expect($totals['shipping_cents'])->toBe(0);
});

test('shipping is 9900 cents when subtotal is below 99900 cents', function () {
    $cart = makeCartWithSubtotal(50_000);
    $cart->load(['items', 'coupon']);

    $totals = app(CartTotalsService::class)->compute($cart);

    expect($totals['shipping_cents'])->toBe(9_900);
});

// ── Coupon usage increment ────────────────────────────────────────────────────

test('placing an order with a coupon increments its used_count by 1', function () {
    Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);

    $user   = User::factory()->create();
    $coupon = Coupon::factory()->percentage(10)->create([
        'min_order_cents' => null,
        'max_uses'        => null,
        'expires_at'      => null,
    ]);

    // Build the user's cart with the coupon pre-applied
    $product = Product::factory()->create(['base_price_cents' => 50_000, 'status' => 'active', 'is_featured' => false]);
    $variant = ProductVariant::factory()->create(['product_id' => $product->id, 'is_active' => true]);
    Inventory::create(['product_variant_id' => $variant->id, 'quantity' => 10, 'reserved_quantity' => 0]);

    $cart = Cart::factory()->forUser($user)->create(['coupon_id' => $coupon->id]);
    CartItem::create([
        'cart_id'            => $cart->id,
        'product_variant_id' => $variant->id,
        'quantity'           => 1,
        'unit_price_cents'   => 50_000,
        'saved_for_later'    => false,
    ]);

    $this->actingAs($user)->post(route('checkout.store'), [
        'first_name'               => 'Juan',
        'last_name'                => 'Dela Cruz',
        'phone'                    => '09171234567',
        'line_1'                   => '123 Rizal Street',
        'city'                     => 'Manila',
        'state'                    => 'Metro Manila',
        'postal_code'              => '1000',
        'country_code'             => 'PH',
        'billing_same_as_shipping' => true,
        'payment_method'           => 'cod',
    ])->assertRedirect();

    expect($coupon->fresh()->used_count)->toBe(1);
});

// ── Expired coupon ────────────────────────────────────────────────────────────

test('expired coupon is not valid', function () {
    $coupon = Coupon::factory()->expired()->create();

    expect($coupon->isValid())->toBeFalse();
});

test('active coupon with future expiry is valid', function () {
    $coupon = Coupon::factory()->create([
        'is_active'  => true,
        'expires_at' => now()->addMonth(),
        'max_uses'   => null,
    ]);

    expect($coupon->isValid())->toBeTrue();
});
