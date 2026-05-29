<?php

use App\Models\Order;
use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'staff',    'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'admin',    'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'vendor',   'guard_name' => 'web']);
});

// ── Staff access ─────────────────────────────────────────────────────────────

test('staff can access admin dashboard', function () {
    $staff = User::factory()->create();
    $staff->assignRole('staff');

    $this->actingAs($staff)->get('/admin')->assertStatus(200);
});

test('admin can access admin dashboard', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)->get('/admin')->assertStatus(200);
});

test('vendor can access vendor dashboard', function () {
    $vendor = User::factory()->create();
    $vendor->assignRole('vendor');

    $this->actingAs($vendor)->get('/vendor')->assertStatus(200);
});

test('vendor cannot access admin dashboard', function () {
    $vendor = User::factory()->create();
    $vendor->assignRole('vendor');

    $this->actingAs($vendor)->get('/admin')->assertForbidden();
});

test('admin can access vendor dashboard', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)->get('/vendor')->assertStatus(200);
});

// ── ProductPolicy ─────────────────────────────────────────────────────────────

test('customer cannot create products', function () {
    $customer = User::factory()->create();
    $customer->assignRole('customer');

    expect($customer->can('create', Product::class))->toBeFalse();
});

test('staff can create products', function () {
    $staff = User::factory()->create();
    $staff->assignRole('staff');

    expect($staff->can('create', Product::class))->toBeTrue();
});

test('vendor can create products', function () {
    $vendor = User::factory()->create();
    $vendor->assignRole('vendor');

    expect($vendor->can('create', Product::class))->toBeTrue();
});

test('vendor can only update their own product', function () {
    $vendor = User::factory()->create();
    $vendor->assignRole('vendor');

    $ownProduct   = Product::factory()->create(['vendor_id' => $vendor->id]);
    $otherProduct = Product::factory()->create(['vendor_id' => null]);

    expect($vendor->can('update', $ownProduct))->toBeTrue();
    expect($vendor->can('update', $otherProduct))->toBeFalse();
});

test('admin can update any product', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $product = Product::factory()->create();

    expect($admin->can('update', $product))->toBeTrue();
});

// ── OrderPolicy ───────────────────────────────────────────────────────────────

test('customer can only view their own order', function () {
    $customer = User::factory()->create();
    $customer->assignRole('customer');

    $ownOrder   = Order::factory()->create(['user_id' => $customer->id]);
    $otherOrder = Order::factory()->create();

    expect($customer->can('view', $ownOrder))->toBeTrue();
    expect($customer->can('view', $otherOrder))->toBeFalse();
});

test('staff can view any order', function () {
    $staff = User::factory()->create();
    $staff->assignRole('staff');

    $order = Order::factory()->create();

    expect($staff->can('view', $order))->toBeTrue();
});

test('customer cannot update order status', function () {
    $customer = User::factory()->create();
    $customer->assignRole('customer');

    expect($customer->can('updateStatus', Order::class))->toBeFalse();
});

test('staff can update order status', function () {
    $staff = User::factory()->create();
    $staff->assignRole('staff');

    expect($staff->can('updateStatus', Order::class))->toBeTrue();
});

// ── ReviewPolicy ─────────────────────────────────────────────────────────────

test('verified user can create a review', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('customer');

    expect($user->can('create', Review::class))->toBeTrue();
});

test('unverified user cannot create a review', function () {
    $user = User::factory()->unverified()->create();
    $user->assignRole('customer');

    expect($user->can('create', Review::class))->toBeFalse();
});

test('user can delete their own review', function () {
    $user   = User::factory()->create();
    $review = Review::factory()->create(['user_id' => $user->id]);

    expect($user->can('delete', $review))->toBeTrue();
});

test('user cannot delete someone else review', function () {
    $user   = User::factory()->create();
    $review = Review::factory()->create();

    expect($user->can('delete', $review))->toBeFalse();
});

test('staff can approve reviews', function () {
    $staff = User::factory()->create();
    $staff->assignRole('staff');

    expect($staff->can('approve', Review::class))->toBeTrue();
});

test('customer cannot approve reviews', function () {
    $customer = User::factory()->create();
    $customer->assignRole('customer');

    expect($customer->can('approve', Review::class))->toBeFalse();
});

// ── UserPolicy ────────────────────────────────────────────────────────────────

test('admin can view any user', function () {
    $admin  = User::factory()->create();
    $admin->assignRole('admin');
    $target = User::factory()->create();

    expect($admin->can('view', $target))->toBeTrue();
});

test('customer can only view themselves', function () {
    $customer = User::factory()->create();
    $customer->assignRole('customer');
    $other = User::factory()->create();

    expect($customer->can('view', $customer))->toBeTrue();
    expect($customer->can('view', $other))->toBeFalse();
});

test('only admin can assign roles', function () {
    $admin    = User::factory()->create();
    $admin->assignRole('admin');
    $customer = User::factory()->create();
    $customer->assignRole('customer');

    expect($admin->can('assignRole', User::class))->toBeTrue();
    expect($customer->can('assignRole', User::class))->toBeFalse();
});
