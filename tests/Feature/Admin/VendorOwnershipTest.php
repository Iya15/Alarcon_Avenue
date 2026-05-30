<?php

use App\Models\Product;
use App\Models\User;
use App\Policies\ProductPolicy;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'admin',  'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'staff',  'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'vendor', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);
});

// ── ProductPolicy: vendor update ──────────────────────────────────────────────
// Note: admin HTTP routes currently require role:staff|admin, so vendor product
// management must go through a future /vendor/products route group. These tests
// verify the Policy logic is correct so that route group can be added safely.

test('ProductPolicy allows vendor to update their own product', function () {
    $vendor  = User::factory()->create();
    $vendor->assignRole('vendor');
    $product = Product::factory()->create(['vendor_id' => $vendor->id]);

    $policy = new ProductPolicy();

    expect($policy->update($vendor, $product))->toBeTrue();
});

test('ProductPolicy blocks vendor from updating another vendors product', function () {
    $vendorA = User::factory()->create();
    $vendorA->assignRole('vendor');
    $vendorB = User::factory()->create();
    $vendorB->assignRole('vendor');
    $product = Product::factory()->create(['vendor_id' => $vendorB->id]);

    $policy = new ProductPolicy();

    expect($policy->update($vendorA, $product))->toBeFalse();
});

test('ProductPolicy allows vendor to delete their own product', function () {
    $vendor  = User::factory()->create();
    $vendor->assignRole('vendor');
    $product = Product::factory()->create(['vendor_id' => $vendor->id]);

    $policy = new ProductPolicy();

    expect($policy->delete($vendor, $product))->toBeTrue();
});

test('ProductPolicy blocks vendor from deleting another vendors product', function () {
    $vendorA = User::factory()->create();
    $vendorA->assignRole('vendor');
    $vendorB = User::factory()->create();
    $vendorB->assignRole('vendor');
    $product = Product::factory()->create(['vendor_id' => $vendorB->id]);

    $policy = new ProductPolicy();

    expect($policy->delete($vendorA, $product))->toBeFalse();
});

// ── ProductPolicy: force delete (admin-only) ──────────────────────────────────

test('ProductPolicy allows only admin to force-delete', function () {
    $admin  = User::factory()->create();
    $admin->assignRole('admin');
    $staff  = User::factory()->create();
    $staff->assignRole('staff');
    $vendor = User::factory()->create();
    $vendor->assignRole('vendor');
    $product = Product::factory()->create();

    $policy = new ProductPolicy();

    expect($policy->forceDelete($admin, $product))->toBeTrue();
    expect($policy->forceDelete($staff, $product))->toBeFalse();
    expect($policy->forceDelete($vendor, $product))->toBeFalse();
});

// ── HTTP: admin routes correctly block vendor role ────────────────────────────

test('vendor role cannot access admin panel product routes', function () {
    $vendor = User::factory()->create();
    $vendor->assignRole('vendor');

    // Admin product list is role:staff|admin only
    $this->actingAs($vendor)
        ->get(route('admin.products.index'))
        ->assertForbidden();
});

// ── ProductPolicy: staff can update non-vendor products ───────────────────────

test('ProductPolicy allows staff to update non-vendor products', function () {
    $staff   = User::factory()->create();
    $staff->assignRole('staff');
    $product = Product::factory()->create(['vendor_id' => null]);

    $policy = new ProductPolicy();

    expect($policy->update($staff, $product))->toBeTrue();
});

test('ProductPolicy allows staff to delete non-vendor products', function () {
    $staff   = User::factory()->create();
    $staff->assignRole('staff');
    $product = Product::factory()->create(['vendor_id' => null]);

    $policy = new ProductPolicy();

    expect($policy->delete($staff, $product))->toBeTrue();
});

test('ProductPolicy blocks staff from deleting vendor-owned products', function () {
    $staff   = User::factory()->create();
    $staff->assignRole('staff');
    $vendor  = User::factory()->create();
    $product = Product::factory()->create(['vendor_id' => $vendor->id]);

    $policy = new ProductPolicy();

    // Staff can only delete non-vendor products; vendor products require admin or the vendor
    expect($policy->delete($staff, $product))->toBeFalse();
});
