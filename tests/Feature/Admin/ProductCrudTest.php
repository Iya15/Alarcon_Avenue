<?php

use App\Models\Category;
use App\Models\Inventory;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'admin',    'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'staff',    'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'vendor',   'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);
});

// ── Access control ─────────────────────────────────────────────────────────────

test('guest cannot list admin products', function () {
    $this->get(route('admin.products.index'))->assertRedirect(route('login'));
});

test('customer is forbidden from admin products', function () {
    $user = User::factory()->create();
    $user->assignRole('customer');
    $this->actingAs($user)->get(route('admin.products.index'))->assertForbidden();
});

test('staff can view admin product list', function () {
    $staff = User::factory()->create();
    $staff->assignRole('staff');
    $this->actingAs($staff)->get(route('admin.products.index'))->assertOk();
});

// ── Create ─────────────────────────────────────────────────────────────────────

test('staff can create a product with a default variant and inventory row', function () {
    $staff = User::factory()->create();
    $staff->assignRole('staff');

    $response = $this->actingAs($staff)->post(route('admin.products.store'), [
        'name'             => 'Test Shirt',
        'base_price_cents' => 49900,
        'status'           => 'draft',
        'is_featured'      => false,
    ]);

    $product = Product::where('name', 'Test Shirt')->firstOrFail();
    $response->assertRedirect(route('admin.products.edit', $product));

    expect($product->slug)->toBe('test-shirt');
    expect($product->variants()->count())->toBe(1);
    expect(Inventory::where('product_variant_id', $product->variants->first()->id)->exists())->toBeTrue();
});

test('creating a product syncs categories', function () {
    $staff = User::factory()->create();
    $staff->assignRole('staff');
    $cat = Category::factory()->create();

    $this->actingAs($staff)->post(route('admin.products.store'), [
        'name'             => 'Categorized Product',
        'base_price_cents' => 10000,
        'status'           => 'active',
        'is_featured'      => false,
        'category_ids'     => [$cat->id],
    ]);

    $product = Product::where('name', 'Categorized Product')->firstOrFail();
    expect($product->categories->pluck('id')->contains($cat->id))->toBeTrue();
});

// ── Update ────────────────────────────────────────────────────────────────────

test('staff can update a product', function () {
    $staff   = User::factory()->create();
    $staff->assignRole('staff');
    $product = Product::factory()->create(['name' => 'Old Name', 'base_price_cents' => 10000, 'status' => 'draft', 'is_featured' => false]);

    $this->actingAs($staff)->put(route('admin.products.update', $product), [
        'name'             => 'Updated Name',
        'base_price_cents' => 15000,
        'status'           => 'active',
        'is_featured'      => true,
    ])->assertRedirect(route('admin.products.edit', $product));

    expect($product->fresh()->name)->toBe('Updated Name');
    expect($product->fresh()->base_price_cents)->toBe(15000);
    expect($product->fresh()->status)->toBe('active');
});

// ── Soft delete + restore ──────────────────────────────────────────────────────

test('staff can soft-delete (archive) a product', function () {
    $staff   = User::factory()->create();
    $staff->assignRole('staff');
    $product = Product::factory()->create(['name' => 'Archive Me', 'base_price_cents' => 1000, 'status' => 'active', 'is_featured' => false]);

    $this->actingAs($staff)->delete(route('admin.products.destroy', $product));

    expect(Product::withTrashed()->find($product->id)->deleted_at)->not->toBeNull();
});

test('admin can restore a soft-deleted product', function () {
    $admin   = User::factory()->create();
    $admin->assignRole('admin');
    $product = Product::factory()->create(['name' => 'Restore Me', 'base_price_cents' => 1000, 'status' => 'active', 'is_featured' => false]);
    $product->delete();

    $this->actingAs($admin)->post(route('admin.products.restore', $product->id));

    expect(Product::find($product->id)?->deleted_at)->toBeNull();
});

// ── Vendor owns their product ─────────────────────────────────────────────────

test('vendor cannot update another vendor product', function () {
    $vendor1 = User::factory()->create();
    $vendor2 = User::factory()->create();
    $vendor1->assignRole('vendor');
    $vendor2->assignRole('vendor');

    $product = Product::factory()->create([
        'vendor_id'        => $vendor1->id,
        'name'             => 'Vendor1 Product',
        'base_price_cents' => 1000,
        'status'           => 'active',
        'is_featured'      => false,
    ]);

    $this->actingAs($vendor2)->put(route('admin.products.update', $product), [
        'name'             => 'Hacked Name',
        'base_price_cents' => 1000,
        'status'           => 'active',
        'is_featured'      => false,
    ])->assertForbidden();
});

// ── Validation ────────────────────────────────────────────────────────────────

test('base_price_cents is required', function () {
    $staff = User::factory()->create();
    $staff->assignRole('staff');

    $this->actingAs($staff)->post(route('admin.products.store'), [
        'name'   => 'No Price Product',
        'status' => 'draft',
    ])->assertSessionHasErrors('base_price_cents');
});
