<?php

use App\Http\Requests\SearchRequest;
use App\Services\SearchService;
use Illuminate\Http\Request;

function makeSearchRequest(array $params = []): SearchRequest
{
    $request = SearchRequest::create('/search', 'GET', $params);
    $request->setContainer(app());
    $request->validateResolved();
    return $request;
}

// ── Filter expression builder ─────────────────────────────────────────────────

test('base filter always includes status = active', function () {
    $service = new SearchService();
    $req     = makeSearchRequest();

    $expr = $service->buildFilterExpression($req);

    expect($expr)->toContain('status = "active"');
});

test('category IDs are added as IN filter', function () {
    $service = new SearchService();
    $req     = makeSearchRequest(['categories' => [3, 7]]);

    $expr = $service->buildFilterExpression($req);

    expect($expr)->toContain('category_ids IN [3,7]');
});

test('brand IDs are added as IN filter', function () {
    $service = new SearchService();
    $req     = makeSearchRequest(['brand_ids' => [1, 2]]);

    $expr = $service->buildFilterExpression($req);

    expect($expr)->toContain('brand_id IN [1,2]');
});

test('colors are quoted in filter expression', function () {
    $service = new SearchService();
    $req     = makeSearchRequest(['colors' => ['black', 'white']]);

    $expr = $service->buildFilterExpression($req);

    expect($expr)->toContain('colors IN ["black","white"]');
});

test('price range is expressed as two conditions', function () {
    $service = new SearchService();
    $req     = makeSearchRequest(['price_min' => 10000, 'price_max' => 50000]);

    $expr = $service->buildFilterExpression($req);

    expect($expr)
        ->toContain('lowest_variant_price_cents >= 10000')
        ->toContain('lowest_variant_price_cents <= 50000');
});

test('in_stock filter is added when truthy', function () {
    $service = new SearchService();
    $req     = makeSearchRequest(['in_stock' => '1']);

    $expr = $service->buildFilterExpression($req);

    expect($expr)->toContain('in_stock = true');
});

test('in_stock filter is omitted when falsy', function () {
    $service = new SearchService();
    $req     = makeSearchRequest(['in_stock' => '0']);

    $expr = $service->buildFilterExpression($req);

    expect($expr)->not->toContain('in_stock');
});

test('has_discount filter is added when truthy', function () {
    $service = new SearchService();
    $req     = makeSearchRequest(['has_discount' => '1']);

    $expr = $service->buildFilterExpression($req);

    expect($expr)->toContain('has_discount = true');
});

test('rating_min translates to rating_average filter', function () {
    $service = new SearchService();
    $req     = makeSearchRequest(['rating_min' => 4]);

    $expr = $service->buildFilterExpression($req);

    expect($expr)->toContain('rating_average >= 4');
});

test('multiple filters are joined with AND', function () {
    $service = new SearchService();
    $req     = makeSearchRequest([
        'categories'  => [1],
        'colors'      => ['red'],
        'in_stock'    => '1',
        'price_max'   => 100000,
    ]);

    $expr = $service->buildFilterExpression($req);

    expect($expr)
        ->toContain(' AND ')
        ->toContain('status = "active"')
        ->toContain('category_ids IN [1]')
        ->toContain('colors IN ["red"]')
        ->toContain('in_stock = true')
        ->toContain('lowest_variant_price_cents <= 100000');
});

// ── Sort expression builder ───────────────────────────────────────────────────

test('price_asc sort maps to lowest_variant_price_cents:asc', function () {
    $service = new SearchService();
    expect($service->buildSortExpression('price_asc'))->toBe(['lowest_variant_price_cents:asc']);
});

test('price_desc sort maps to lowest_variant_price_cents:desc', function () {
    $service = new SearchService();
    expect($service->buildSortExpression('price_desc'))->toBe(['lowest_variant_price_cents:desc']);
});

test('newest sort maps to created_at:desc', function () {
    $service = new SearchService();
    expect($service->buildSortExpression('newest'))->toBe(['created_at:desc']);
});

test('rating sort maps to rating_average:desc', function () {
    $service = new SearchService();
    expect($service->buildSortExpression('rating'))->toBe(['rating_average:desc']);
});

test('relevance sort returns empty array', function () {
    $service = new SearchService();
    expect($service->buildSortExpression('relevance'))->toBe([]);
});

// ── SearchRequest validation ──────────────────────────────────────────────────

test('invalid sort value fails validation', function () {
    $this->get('/search?sort=invalid')->assertSessionHasErrors('sort');
});

test('sort=price_asc passes validation', function () {
    $mock = Mockery::mock(\App\Services\SearchService::class);
    $mock->shouldReceive('search')->andReturn([
        'hits'       => [],
        'pagination' => ['page' => 1, 'hitsPerPage' => 24, 'totalHits' => 0, 'totalPages' => 1],
        'facets'     => ['categories' => [], 'brands' => [], 'colors' => [], 'sizes' => [], 'materials' => [], 'in_stock' => 0, 'has_discount' => 0, 'price_min' => 0, 'price_max' => 0],
    ]);
    app()->instance(\App\Services\SearchService::class, $mock);

    $this->get('/search?sort=price_asc')->assertOk();
});

test('categories must be integers', function () {
    $this->get('/search?categories[]=abc')->assertSessionHasErrors('categories.0');
});

test('price_min must be non-negative', function () {
    $this->get('/search?price_min=-1')->assertSessionHasErrors('price_min');
});

test('rating_min must be between 1 and 5', function () {
    $this->get('/search?rating_min=6')->assertSessionHasErrors('rating_min');
});
