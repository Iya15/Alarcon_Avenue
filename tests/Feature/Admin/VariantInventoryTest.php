<?php

use App\Models\Attribute;
use App\Models\AttributeValue;
use App\Models\Inventory;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'staff', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
});

test('staff can add a variant with attribute values', function () {
    $staff   = User::factory()->create();
    $staff->assignRole('staff');
    $product = Product::factory()->create(['name' => 'P', 'base_price_cents' => 1000, 'status' => 'active', 'is_featured' => false]);

    $attr  = Attribute::factory()->create(['name' => 'color', 'display_name' => 'Color', 'type' => 'color_swatch']);
    $value = AttributeValue::factory()->create(['attribute_id' => $attr->id, 'value' => 'red', 'display_value' => 'Red']);

    $this->actingAs($staff)->post(route('admin.variants.store', $product), [
        'sku'                 => 'TST-RED-001',
        'is_active'           => true,
        'attribute_value_ids' => [$value->id],
        'initial_quantity'    => 25,
    ])->assertRedirect(route('admin.products.edit', $product));

    $variant = ProductVariant::where('sku', 'TST-RED-001')->firstOrFail();
    expect($variant->attributeValues->pluck('id')->contains($value->id))->toBeTrue();
    expect($variant->inventory->quantity)->toBe(25);
});

test('cannot delete the last variant of a product', function () {
    $staff   = User::factory()->create();
    $staff->assignRole('staff');
    $product = Product::factory()->create(['name' => 'P', 'base_price_cents' => 1000, 'status' => 'active', 'is_featured' => false]);
    $variant = $product->variants()->firstOrCreate(['sku' => 'ONLY-001', 'is_active' => true]);

    $this->actingAs($staff)->delete(route('admin.variants.destroy', $variant))
        ->assertSessionHasErrors('variant');
});

test('staff can update inventory quantity', function () {
    $staff   = User::factory()->create();
    $staff->assignRole('staff');
    $product = Product::factory()->create(['name' => 'P', 'base_price_cents' => 1000, 'status' => 'active', 'is_featured' => false]);
    $variant = ProductVariant::factory()->create(['product_id' => $product->id, 'sku' => 'INV-TST', 'is_active' => true]);
    Inventory::create(['product_variant_id' => $variant->id, 'quantity' => 0, 'reserved_quantity' => 0]);

    $this->actingAs($staff)->patch(route('admin.inventory.update', $variant), [
        'quantity'            => 50,
        'low_stock_threshold' => 5,
    ])->assertRedirect(route('admin.products.edit', $product));

    expect($variant->inventory->fresh()->quantity)->toBe(50);
    expect($variant->inventory->fresh()->low_stock_threshold)->toBe(5);
});

test('updating inventory does not reset reserved_quantity', function () {
    $staff   = User::factory()->create();
    $staff->assignRole('staff');
    $product = Product::factory()->create(['name' => 'P', 'base_price_cents' => 1000, 'status' => 'active', 'is_featured' => false]);
    $variant = ProductVariant::factory()->create(['product_id' => $product->id, 'sku' => 'RSV-TST', 'is_active' => true]);
    Inventory::create(['product_variant_id' => $variant->id, 'quantity' => 10, 'reserved_quantity' => 3]);

    $this->actingAs($staff)->patch(route('admin.inventory.update', $variant), ['quantity' => 20]);

    expect($variant->inventory->fresh()->reserved_quantity)->toBe(3);
});
