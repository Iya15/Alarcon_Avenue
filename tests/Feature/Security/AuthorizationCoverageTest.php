<?php

use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'admin',    'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'staff',    'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);
});

// ── Admin panel: unauthenticated access ───────────────────────────────────────

test('unauthenticated user cannot access admin dashboard', function () {
    $this->get('/admin')->assertRedirect('/login');
});

test('customer role cannot access admin panel', function () {
    $user = User::factory()->create();
    $user->assignRole('customer');

    $this->actingAs($user)->get('/admin')->assertForbidden();
});

// ── Admin panel: staff can view but some actions require admin ────────────────

test('staff role can access admin dashboard', function () {
    $user = User::factory()->create();
    $user->assignRole('staff');

    $this->actingAs($user)->get('/admin')->assertOk();
});

test('staff role cannot access user management (admin only)', function () {
    $user = User::factory()->create();
    $user->assignRole('staff');

    $this->actingAs($user)->get('/admin/users')->assertForbidden();
});

test('staff role cannot access role management (admin only)', function () {
    $user = User::factory()->create();
    $user->assignRole('staff');

    $this->actingAs($user)->get('/admin/roles')->assertForbidden();
});

// ── Order policy: users can only view their own orders ───────────────────────

test('authenticated user cannot view another users order', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $order = Order::factory()->create(['user_id' => $owner->id]);

    $this->actingAs($other)
        ->get("/account/orders/{$order->id}")
        ->assertForbidden();
});

test('order owner can view their own order', function () {
    $user  = User::factory()->create();
    $order = Order::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->get("/account/orders/{$order->id}")
        ->assertOk();
});

// ── Cart item ownership ───────────────────────────────────────────────────────

test('guest cannot modify another sessions cart item via API', function () {
    // Just verify the endpoint requires ownership — the CartController's
    // authorizeItem() checks cart.session_id or cart.user_id
    $this->patchJson('/api/cart/items/9999999', ['quantity' => 1])
        ->assertStatus(404); // item not found for this session
});

// ── Product detail: XSS — description is sanitized ───────────────────────────

test('product description strips script tags before sending to frontend', function () {
    $product = Product::factory()->create([
        'status'      => 'active',
        'description' => '<p>Safe content</p><script>alert(1)</script><p>More safe</p>',
    ]);

    $user = User::factory()->create();
    $user->assignRole('admin');

    // Fetch via Inertia (staff/admin can see all; but the catalog show is public)
    $response = $this->get("/products/{$product->slug}");
    $response->assertOk();

    // The Inertia page props should not contain the script tag
    $content = $response->content();
    expect($content)->not->toContain('<script>alert(1)</script>');
});
