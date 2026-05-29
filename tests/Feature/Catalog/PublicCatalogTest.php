<?php

use App\Models\Category;
use App\Models\Inventory;
use App\Models\Product;
use App\Models\ProductVariant;

function makeActiveProduct(string $name = 'Test Product', int $price = 99900): Product
{
    $product = Product::factory()->create([
        'name'             => $name,
        'base_price_cents' => $price,
        'status'           => 'active',
        'is_featured'      => false,
    ]);

    $variant = ProductVariant::factory()->create([
        'product_id' => $product->id,
        'sku'        => 'TST-' . strtoupper(str_replace(' ', '-', $name)) . '-001',
        'is_active'  => true,
    ]);

    Inventory::create([
        'product_variant_id' => $variant->id,
        'quantity'           => 10,
        'reserved_quantity'  => 0,
    ]);

    return $product;
}

// ── Product listing ────────────────────────────────────────────────────────────

test('public product index renders with active products', function () {
    makeActiveProduct('Alpha');
    makeActiveProduct('Beta');

    $this->get(route('products.index'))->assertOk()->assertInertia(
        fn ($page) => $page
            ->component('Products/Index')
            ->has('products.data', 2)
    );
});

test('draft products are not shown on public listing', function () {
    makeActiveProduct('Visible');
    Product::factory()->create([
        'name'             => 'Hidden Draft',
        'base_price_cents' => 100,
        'status'           => 'draft',
        'is_featured'      => false,
    ]);

    $this->get(route('products.index'))->assertOk()->assertInertia(
        fn ($page) => $page->has('products.data', 1)
    );
});

test('products can be sorted by price', function () {
    makeActiveProduct('Cheap',     500);
    makeActiveProduct('Expensive', 50000);

    $this->get(route('products.index', ['sort' => 'price_asc']))->assertOk()->assertInertia(
        fn ($page) => $page->has('products.data', 2)
    );
});

// ── Category page ──────────────────────────────────────────────────────────────

test('category show renders products in that category', function () {
    $category = Category::factory()->create(['slug' => 'clothing', 'name' => 'Clothing', 'is_active' => true]);
    $product  = makeActiveProduct('In Category');
    $product->categories()->attach($category->id);

    $other = makeActiveProduct('Not In Category');

    $this->get(route('categories.show', 'clothing'))->assertOk()->assertInertia(
        fn ($page) => $page
            ->component('Products/Index')
            ->has('products.data', 1)
            ->where('products.data.0.slug', $product->slug)
    );
});

test('inactive categories return 404', function () {
    Category::factory()->create(['slug' => 'hidden', 'is_active' => false]);
    $this->get(route('categories.show', 'hidden'))->assertNotFound();
});

// ── Product detail ─────────────────────────────────────────────────────────────

test('public product show renders with full variant data', function () {
    $product = makeActiveProduct('Detail Product');

    $this->get(route('products.show', $product->slug))->assertOk()->assertInertia(
        fn ($page) => $page
            ->component('Products/Show')
            ->where('product.slug', $product->slug)
            ->has('product.variants')
    );
});

test('archived product returns 404 on public page', function () {
    $product = Product::factory()->create([
        'name'             => 'Archived',
        'base_price_cents' => 100,
        'status'           => 'archived',
        'is_featured'      => false,
    ]);

    $this->get(route('products.show', $product->slug))->assertNotFound();
});

test('product show includes related products from same category', function () {
    $category = Category::factory()->create(['is_active' => true]);
    $product1 = makeActiveProduct('Product 1');
    $product2 = makeActiveProduct('Product 2');
    $product1->categories()->attach($category->id);
    $product2->categories()->attach($category->id);

    $this->get(route('products.show', $product1->slug))->assertOk()->assertInertia(
        fn ($page) => $page->has('relatedProducts')
    );
});

// ── Stock display ──────────────────────────────────────────────────────────────

test('out-of-stock variant shows in_stock false', function () {
    $product = Product::factory()->create([
        'name'             => 'OOS Product',
        'base_price_cents' => 500,
        'status'           => 'active',
        'is_featured'      => false,
    ]);
    $variant = ProductVariant::factory()->create(['product_id' => $product->id, 'sku' => 'OOS-001', 'is_active' => true]);
    Inventory::create(['product_variant_id' => $variant->id, 'quantity' => 0, 'reserved_quantity' => 0]);

    $this->get(route('products.show', $product->slug))->assertOk()->assertInertia(
        fn ($page) => $page->where('product.variants.0.inventory.in_stock', false)
    );
});
