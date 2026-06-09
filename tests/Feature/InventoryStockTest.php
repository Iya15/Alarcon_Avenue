<?php

use App\Actions\Admin\Inventory\UpdateInventoryAction;
use App\Http\Resources\InventoryResource;
use App\Models\Inventory;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Support\Facades\Cache;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

it('shows in_stock true after inventory is updated from 0 to positive quantity', function () {
    $product = Product::factory()->create(['status' => 'active']);
    $variant = ProductVariant::factory()->create(['product_id' => $product->id, 'is_active' => true]);
    $inventory = Inventory::create([
        'product_variant_id' => $variant->id,
        'quantity'           => 0,
        'reserved_quantity'  => 0,
    ]);

    // Initially out of stock
    $resource = new InventoryResource($inventory);
    expect($resource->resolve()['in_stock'])->toBeFalse();

    // Update inventory to 5
    $action = app(UpdateInventoryAction::class);
    $action->execute($variant, ['quantity' => 5]);

    $inventory->refresh();
    $resource = new InventoryResource($inventory);
    expect($resource->resolve()['in_stock'])->toBeTrue();
    expect($resource->resolve()['available'])->toBe(5);
});

it('clears homepage caches when inventory is updated', function () {
    Cache::put('homepage.featured', 'stale', 3600);
    Cache::put('homepage.bestsellers', 'stale', 3600);

    $product = Product::factory()->create(['status' => 'active']);
    $variant = ProductVariant::factory()->create(['product_id' => $product->id]);
    Inventory::create([
        'product_variant_id' => $variant->id,
        'quantity'           => 0,
        'reserved_quantity'  => 0,
    ]);

    $action = app(UpdateInventoryAction::class);
    $action->execute($variant, ['quantity' => 10]);

    expect(Cache::has('homepage.featured'))->toBeFalse();
    expect(Cache::has('homepage.bestsellers'))->toBeFalse();
});
