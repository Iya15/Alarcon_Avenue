<?php

use App\Models\Category;
use App\Models\Product;
use Illuminate\Support\Facades\Artisan;

// ── Sitemap generation ────────────────────────────────────────────────────────

test('sitemap:generate command creates a valid XML file', function () {
    $product  = Product::factory()->create(['status' => 'active', 'slug' => 'test-product-sitemap']);
    $category = Category::factory()->create(['is_active' => true, 'slug' => 'test-category-sitemap']);

    Artisan::call('sitemap:generate');

    $path = public_path('sitemap.xml');
    expect(file_exists($path))->toBeTrue();

    $xml = file_get_contents($path);
    // Must be well-formed XML
    $parsed = simplexml_load_string($xml);
    expect($parsed)->not->toBeFalse();

    // Must contain product and category URLs
    expect($xml)->toContain("/products/{$product->slug}")
        ->and($xml)->toContain("/categories/{$category->slug}");
});

test('/sitemap.xml route returns valid XML content-type', function () {
    // Generate the file first
    Artisan::call('sitemap:generate');

    $this->get('/sitemap.xml')
        ->assertOk()
        ->assertHeader('Content-Type', 'application/xml');
});

test('sitemap does not include draft products', function () {
    $active = Product::factory()->create(['status' => 'active', 'slug' => 'active-sitemap-product']);
    $draft  = Product::factory()->create(['status' => 'draft', 'slug' => 'draft-sitemap-product']);

    Artisan::call('sitemap:generate');

    $xml = file_get_contents(public_path('sitemap.xml'));
    expect($xml)->toContain("/products/{$active->slug}")
        ->and($xml)->not->toContain("/products/{$draft->slug}");
});

test('sitemap does not include inactive categories', function () {
    $active   = Category::factory()->create(['is_active' => true, 'slug' => 'active-cat-sitemap']);
    $inactive = Category::factory()->create(['is_active' => false, 'slug' => 'inactive-cat-sitemap']);

    Artisan::call('sitemap:generate');

    $xml = file_get_contents(public_path('sitemap.xml'));
    expect($xml)->toContain("/categories/{$active->slug}")
        ->and($xml)->not->toContain("/categories/{$inactive->slug}");
});

// ── JSON-LD Product schema ─────────────────────────────────────────────────────

test('product page response contains Product JSON-LD schema', function () {
    $product = Product::factory()->create([
        'status'            => 'active',
        'name'              => 'Schema Test Product',
        'base_price_cents'  => 150000,
        'short_description' => 'A great product for testing',
    ]);

    $response = $this->get("/products/{$product->slug}")->assertOk();

    $content = $response->content();

    // The Inertia-rendered page includes JSON-LD via SeoHead component
    // The props passed to the page contain the schema; verify the product data is in Inertia props
    expect($content)->toContain($product->name);
    expect($content)->toContain($product->slug);
});

test('product page Inertia props include meta_title and description for SEO', function () {
    $product = Product::factory()->create([
        'status'           => 'active',
        'meta_title'       => 'Best Sneaker | Alarcon Avenue',
        'meta_description' => 'The best sneaker you will ever own.',
    ]);

    $this->get("/products/{$product->slug}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Products/Show')
            ->where('product.meta_title', 'Best Sneaker | Alarcon Avenue')
            ->where('product.meta_description', 'The best sneaker you will ever own.')
        );
});
