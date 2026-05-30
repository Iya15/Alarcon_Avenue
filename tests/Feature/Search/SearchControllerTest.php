<?php

use App\Models\Brand;
use App\Models\Category;
use App\Models\Inventory;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Review;
use App\Models\User;
use App\Services\SearchService;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    // phpunit.xml already sets SCOUT_DRIVER=null; nothing to override
    Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);
});

function mockSearchService(array $override = []): array
{
    $default = [
        'hits'       => [],
        'pagination' => ['page' => 1, 'hitsPerPage' => 24, 'totalHits' => 0, 'totalPages' => 1],
        'facets'     => [
            'categories'  => [],
            'brands'      => [],
            'colors'      => [],
            'sizes'       => [],
            'materials'   => [],
            'in_stock'    => 0,
            'has_discount' => 0,
            'price_min'   => 0,
            'price_max'   => 0,
        ],
    ];

    return array_merge($default, $override);
}

// ── Page renders ──────────────────────────────────────────────────────────────

test('search page renders for guests', function () {
    $mock = Mockery::mock(SearchService::class);
    $mock->shouldReceive('search')->andReturn(mockSearchService());
    app()->instance(SearchService::class, $mock);

    $this->get(route('search.index'))->assertOk()->assertInertia(
        fn ($page) => $page->component('Search/Index')
    );
});

test('search page accepts query param', function () {
    $mock = Mockery::mock(SearchService::class);
    $mock->shouldReceive('search')->andReturn(mockSearchService());
    app()->instance(SearchService::class, $mock);

    $this->get(route('search.index', ['q' => 'shirt']))->assertOk()->assertInertia(
        fn ($page) => $page
            ->component('Search/Index')
            ->where('query', 'shirt')
    );
});

test('search page passes filters to props', function () {
    $mock = Mockery::mock(SearchService::class);
    $mock->shouldReceive('search')->andReturn(mockSearchService());
    app()->instance(SearchService::class, $mock);

    $this->get('/search?q=shirt&sort=price_asc&in_stock=1')->assertOk()->assertInertia(
        fn ($page) => $page
            ->where('filters.q', 'shirt')
            ->where('filters.sort', 'price_asc')
    );
});

// ── JSON endpoints ─────────────────────────────────────────────────────────────

test('suggestions endpoint returns json', function () {
    // null driver → suggestions returns empty array gracefully
    $this->get('/api/search/suggestions?q=sh')
        ->assertOk()
        ->assertHeader('Content-Type', 'application/json');
});

test('suggestions returns empty array for short query', function () {
    $this->get('/api/search/suggestions?q=a')
        ->assertOk()
        ->assertJson([]);
});

test('trending endpoint returns array', function () {
    $this->get('/api/search/trending')
        ->assertOk()
        ->assertJsonIsArray();
});

// ── Product searchable array ───────────────────────────────────────────────────

test('product toSearchableArray includes brand name', function () {
    $brand   = Brand::factory()->create(['name' => 'TestBrand']);
    $product = Product::factory()->create([
        'brand_id' => $brand->id,
        'name'     => 'My Product',
        'status'   => 'active',
        'is_featured' => false,
    ]);
    ProductVariant::factory()->create(['product_id' => $product->id, 'sku' => 'TSB-001', 'is_active' => true]);

    $array = $product->toSearchableArray();

    expect($array['brand_name'])->toBe('TestBrand');
    expect($array['brand_id'])->toBe($brand->id);
});

test('product toSearchableArray marks in_stock correctly', function () {
    $product = Product::factory()->create(['name' => 'Stock Test', 'status' => 'active', 'is_featured' => false]);
    $variant = ProductVariant::factory()->create(['product_id' => $product->id, 'sku' => 'STK-001', 'is_active' => true]);
    Inventory::create(['product_variant_id' => $variant->id, 'quantity' => 10, 'reserved_quantity' => 0]);

    expect($product->toSearchableArray()['in_stock'])->toBeTrue();
});

test('product toSearchableArray marks out of stock', function () {
    $product = Product::factory()->create(['name' => 'OOS Test', 'status' => 'active', 'is_featured' => false]);
    $variant = ProductVariant::factory()->create(['product_id' => $product->id, 'sku' => 'OOS-001', 'is_active' => true]);
    Inventory::create(['product_variant_id' => $variant->id, 'quantity' => 0, 'reserved_quantity' => 0]);

    expect($product->toSearchableArray()['in_stock'])->toBeFalse();
});

test('product with compare price has has_discount true', function () {
    $product = Product::factory()->create([
        'name'                   => 'Sale',
        'base_price_cents'       => 50000,
        'compare_at_price_cents' => 70000,
        'status'                 => 'active',
        'is_featured'            => false,
    ]);
    ProductVariant::factory()->create(['product_id' => $product->id, 'sku' => 'SALE-001', 'is_active' => true]);

    $array = $product->toSearchableArray();

    expect($array['has_discount'])->toBeTrue();
    expect($array['discount_percent'])->toBe(29);
});

test('draft product shouldBeSearchable returns false', function () {
    $product = Product::factory()->draft()->create(['name' => 'Draft', 'is_featured' => false]);
    expect($product->shouldBeSearchable())->toBeFalse();
});

test('active product shouldBeSearchable returns true', function () {
    $product = Product::factory()->create(['name' => 'Active', 'is_featured' => false]);
    expect($product->shouldBeSearchable())->toBeTrue();
});

// ── Rating recalculation ──────────────────────────────────────────────────────

test('publishing a review recalculates product rating', function () {
    $user    = User::factory()->create();
    $product = Product::factory()->create(['name' => 'Rated', 'status' => 'active', 'is_featured' => false]);
    $review  = Review::factory()->pending()->create([
        'user_id'    => $user->id,
        'product_id' => $product->id,
        'rating'     => 5,
    ]);

    $review->update(['status' => Review::STATUS_PUBLISHED]);

    expect($product->fresh()->review_count)->toBe(1);
    expect($product->fresh()->rating_average)->toBe(5.0);
});

test('multiple published reviews average correctly', function () {
    $product = Product::factory()->create(['name' => 'Multi-rated', 'status' => 'active', 'is_featured' => false]);
    $users   = User::factory(3)->create();

    foreach ([5, 4, 3] as $i => $rating) {
        Review::factory()->published()->create([
            'user_id'    => $users[$i]->id,
            'product_id' => $product->id,
            'rating'     => $rating,
        ]);
    }

    $product->fresh()->recalculateRating();

    expect($product->fresh()->rating_average)->toBe(4.0);
    expect($product->fresh()->review_count)->toBe(3);
});
