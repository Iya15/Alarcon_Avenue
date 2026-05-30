<?php

use App\Models\Attribute;
use App\Models\AttributeValue;
use App\Models\Inventory;
use App\Models\Product;
use App\Models\ProductVariant;

// ── /api/compare JSON endpoint ────────────────────────────────────────────────

test('compare endpoint returns aligned products and attribute keys', function () {
    $productA = Product::factory()->create(['status' => 'active', 'rating_average' => 4.5]);
    $productB = Product::factory()->create(['status' => 'active', 'rating_average' => 3.8]);

    // Give product A an attribute the compare endpoint should expose
    $attr    = Attribute::factory()->create(['name' => 'color', 'display_name' => 'Color']);
    $value   = AttributeValue::factory()->for($attr)->create(['value' => 'Red', 'display_value' => 'Red']);
    $variant = ProductVariant::factory()->for($productA)->create(['is_active' => true]);
    $variant->attributeValues()->attach($value);
    Inventory::factory()->create(['product_variant_id' => $variant->id, 'quantity' => 5, 'reserved_quantity' => 0]);

    $this->getJson("/api/compare?ids[]={$productA->id}&ids[]={$productB->id}")
        ->assertOk()
        ->assertJsonStructure([
            'products' => [['id', 'name', 'slug', 'attributes', 'in_stock']],
            'attributes',
        ])
        ->assertJsonCount(2, 'products')
        // The 'color' attribute key must be present in attributes map
        ->assertJsonPath('attributes.color', 'Color');
});

test('compare endpoint preserves request order', function () {
    $productA = Product::factory()->create(['status' => 'active']);
    $productB = Product::factory()->create(['status' => 'active']);

    $response = $this->getJson("/api/compare?ids[]={$productB->id}&ids[]={$productA->id}")
        ->assertOk();

    // B comes first because it was listed first in the request
    expect($response->json('products.0.id'))->toBe($productB->id);
    expect($response->json('products.1.id'))->toBe($productA->id);
});

test('compare endpoint silently drops inactive products', function () {
    $active   = Product::factory()->create(['status' => 'active']);
    $inactive = Product::factory()->create(['status' => 'draft']);

    $this->getJson("/api/compare?ids[]={$active->id}&ids[]={$inactive->id}")
        ->assertOk()
        ->assertJsonCount(1, 'products');
});

test('compare endpoint caps at four products', function () {
    $products = Product::factory(6)->create(['status' => 'active']);
    $ids      = $products->pluck('id')->map(fn ($id) => "ids[]={$id}")->implode('&');

    $this->getJson("/api/compare?{$ids}")
        ->assertOk()
        ->assertJsonCount(4, 'products');
});

// ── Inertia /compare page ─────────────────────────────────────────────────────

test('/compare renders Compare component', function () {
    $productA = Product::factory()->create(['status' => 'active']);
    $productB = Product::factory()->create(['status' => 'active']);

    $this->get("/compare?ids[]={$productA->id}&ids[]={$productB->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Compare')->has('products')->has('attributes'));
});

test('/compare returns empty products array when no ids supplied', function () {
    $this->get('/compare')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Compare')->where('products', []));
});
