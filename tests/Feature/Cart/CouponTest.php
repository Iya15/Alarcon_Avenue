<?php

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Coupon;
use App\Models\CouponUsage;
use App\Models\Inventory;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);
    $this->withHeaders(['Accept' => 'application/json']);

    // Use authenticated user so cart resolves by user_id (persists across requests in same test)
    $user = User::factory()->create();
    $user->assignRole('customer');
    $this->actingAs($user);
});

function cartWithItem(int $priceCents = 100_000): array
{
    $product = Product::factory()->create([
        'name'             => 'Coupon Test Product',
        'base_price_cents' => $priceCents,
        'status'           => 'active',
        'is_featured'      => false,
    ]);
    $variant = ProductVariant::factory()->create([
        'product_id' => $product->id,
        'sku'        => 'CPN-' . uniqid(),
        'is_active'  => true,
    ]);
    Inventory::create(['product_variant_id' => $variant->id, 'quantity' => 10, 'reserved_quantity' => 0]);

    $addResponse = test()->post('/api/cart/items', ['variant_id' => $variant->id, 'quantity' => 1]);
    return ['variant' => $variant, 'cart_response' => $addResponse];
}

// ── Percentage coupon ──────────────────────────────────────────────────────────

test('percentage coupon reduces subtotal correctly', function () {
    cartWithItem(100_000); // ₱1,000 subtotal

    Coupon::factory()->create([
        'code'           => 'SAVE20',
        'discount_type'  => 'percentage',
        'discount_value' => 20,
        'is_active'      => true,
        'min_order_cents' => null,
    ]);

    $response = $this->post('/api/cart/coupon', ['code' => 'SAVE20'])->assertOk();

    expect($response->json('totals.discount_cents'))->toBe(20_000); // 20% of 100,000
    // after_discount = 80,000 (below 150,000 threshold) → shipping = 15,000 → total = 95,000
    expect($response->json('totals.total_cents'))->toBe(95_000);
});

// ── Fixed amount coupon ────────────────────────────────────────────────────────

test('fixed amount coupon reduces subtotal by exact amount', function () {
    cartWithItem(200_000); // ₱2,000

    Coupon::factory()->create([
        'code'           => 'FLAT500',
        'discount_type'  => 'fixed_cents',
        'discount_value' => 50_000, // ₱500
        'is_active'      => true,
        'min_order_cents' => null,
    ]);

    $response = $this->post('/api/cart/coupon', ['code' => 'FLAT500'])->assertOk();

    expect($response->json('totals.discount_cents'))->toBe(50_000);
    expect($response->json('totals.subtotal_cents'))->toBe(200_000);
});

test('fixed coupon discount cannot exceed subtotal', function () {
    cartWithItem(30_000); // ₱300

    Coupon::factory()->create([
        'code'           => 'BIG500',
        'discount_type'  => 'fixed_cents',
        'discount_value' => 50_000, // ₱500 — more than subtotal
        'is_active'      => true,
        'min_order_cents' => null,
    ]);

    $response = $this->post('/api/cart/coupon', ['code' => 'BIG500'])->assertOk();

    expect($response->json('totals.discount_cents'))->toBe(30_000); // capped at subtotal
    expect($response->json('totals.total_cents'))->toBe(0);
});

// ── Free shipping coupon ───────────────────────────────────────────────────────

test('free_shipping coupon zeroes the shipping fee', function () {
    cartWithItem(50_000); // ₱500 — below free shipping threshold

    Coupon::factory()->create([
        'code'           => 'FREESHIP',
        'discount_type'  => 'free_shipping',
        'discount_value' => 0,
        'is_active'      => true,
        'min_order_cents' => null,
    ]);

    $response = $this->post('/api/cart/coupon', ['code' => 'FREESHIP'])->assertOk();

    expect($response->json('totals.shipping_cents'))->toBe(0);
    expect($response->json('totals.discount_cents'))->toBe(0); // no $ discount, just free shipping
});

// ── VAT after discount ────────────────────────────────────────────────────────

test('tax is calculated on subtotal after discount', function () {
    cartWithItem(112_000); // ₱1,120 (exactly 12 × 100 for easy math)

    Coupon::factory()->create([
        'code'           => 'HALF',
        'discount_type'  => 'percentage',
        'discount_value' => 50,
        'is_active'      => true,
        'min_order_cents' => null,
    ]);

    $response = $this->post('/api/cart/coupon', ['code' => 'HALF'])->assertOk();

    // subtotal = 112,000 → discount = 56,000 → after_discount = 56,000
    // tax = 56,000 × 12/112 = 6,000
    expect($response->json('totals.tax_cents'))->toBe(6_000);
});

// ── Min order ─────────────────────────────────────────────────────────────────

test('coupon with min_order_cents is rejected below threshold', function () {
    cartWithItem(50_000); // ₱500

    Coupon::factory()->create([
        'code'              => 'MINORD',
        'discount_type'     => 'percentage',
        'discount_value'    => 10,
        'min_order_cents'   => 100_000, // requires ₱1,000
        'is_active'         => true,
    ]);

    $this->post('/api/cart/coupon', ['code' => 'MINORD'])->assertStatus(422);
});

// ── Expiry ────────────────────────────────────────────────────────────────────

test('expired coupon is rejected', function () {
    cartWithItem();

    Coupon::factory()->expired()->create([
        'code'          => 'EXPIRED',
        'discount_type' => 'percentage',
        'discount_value' => 10,
    ]);

    $this->post('/api/cart/coupon', ['code' => 'EXPIRED'])->assertStatus(422);
});

// ── Max uses per user ─────────────────────────────────────────────────────────

test('coupon with max_uses_per_user is rejected when limit reached', function () {
    $user = User::factory()->create();
    $user->assignRole('customer');

    $coupon = Coupon::factory()->create([
        'code'               => 'ONCE',
        'discount_type'      => 'percentage',
        'discount_value'     => 10,
        'max_uses_per_user'  => 1,
        'min_order_cents'    => null,
        'is_active'          => true,
    ]);

    // Simulate one prior usage
    $order = Order::factory()->create(['user_id' => $user->id]);
    CouponUsage::create(['coupon_id' => $coupon->id, 'user_id' => $user->id, 'order_id' => $order->id]);

    $this->actingAs($user);
    cartWithItem();

    $this->actingAs($user)->post('/api/cart/coupon', ['code' => 'ONCE'])->assertStatus(422);
});

// ── Remove coupon ─────────────────────────────────────────────────────────────

test('coupon can be removed from cart', function () {
    cartWithItem(100_000);

    Coupon::factory()->create([
        'code' => 'REMOVE', 'discount_type' => 'percentage', 'discount_value' => 10, 'is_active' => true,
    ]);

    $this->post('/api/cart/coupon', ['code' => 'REMOVE']);
    $response = $this->delete('/api/cart/coupon')->assertOk();

    expect($response->json('totals.discount_cents'))->toBe(0);
    expect($response->json('totals.coupon'))->toBeNull();
});

// ── Invalid code ──────────────────────────────────────────────────────────────

test('unknown coupon code returns 422', function () {
    cartWithItem();
    $this->post('/api/cart/coupon', ['code' => 'DOESNOTEXIST'])->assertStatus(422);
});
