<?php

namespace App\Services;

use App\Http\Requests\SearchRequest;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Support\Collection;

class SearchService
{
    private const PER_PAGE = 24;

    private const FACETS = [
        'category_ids',
        'brand_id',
        'colors',
        'sizes',
        'materials',
        'in_stock',
        'has_discount',
        'rating_average',
        'discount_percent',
    ];

    public function search(SearchRequest $request): array
    {
        $query    = trim($request->input('q', ''));
        $page     = max(1, $request->integer('page', 1));
        $sort     = $request->input('sort', 'relevance');
        $filters  = $this->buildFilterExpression($request);
        $sortExpr = $this->buildSortExpression($sort);

        // Primary search: full filter applied → correct hits + pagination
        $raw = Product::search($query, function ($meiliSearch, string $q, array $options) use ($filters, $sortExpr, $page) {
            if ($filters) {
                $options['filter'] = $filters;
            }
            if ($sortExpr) {
                $options['sort'] = $sortExpr;
            }
            $options['facets']       = self::FACETS;
            $options['hitsPerPage']  = self::PER_PAGE;
            $options['page']         = $page;
            $options['attributesToRetrieve'] = [
                'id', 'name', 'slug', 'base_price_cents', 'lowest_variant_price_cents',
                'compare_at_price_cents', 'has_discount', 'discount_percent',
                'brand_id', 'brand_name', 'brand_slug',
                'category_ids', 'category_names',
                'in_stock', 'is_featured',
                'rating_average', 'review_count',
                'primary_image_url',
            ];

            return $meiliSearch->search($q, $options);
        })->raw();

        // Secondary facet search: filter WITHOUT category/brand so all options stay
        // visible regardless of what the user has already selected. hitsPerPage=0
        // means Meilisearch computes facets only — very fast, no documents returned.
        if ($request->input('categories') || $request->input('brand_ids')) {
            $baseFilter = $this->buildBaseFacetFilter($request);

            $facetRaw = Product::search($query, function ($meiliSearch, string $q, array $options) use ($baseFilter) {
                $options['filter']      = $baseFilter;
                $options['facets']      = ['category_ids', 'brand_id'];
                $options['hitsPerPage'] = 0;

                return $meiliSearch->search($q, $options);
            })->raw();

            // Overlay the "sticky" category/brand facet counts onto the main result
            $raw['facetDistribution']['category_ids'] = $facetRaw['facetDistribution']['category_ids'] ?? [];
            $raw['facetDistribution']['brand_id']     = $facetRaw['facetDistribution']['brand_id'] ?? [];
        }

        return $this->formatResults($raw, $page);
    }

    /**
     * Build a filter expression that includes everything EXCEPT category and brand
     * filters. Used for the secondary facet-only request so all category/brand
     * options remain visible when the user has already selected some.
     */
    private function buildBaseFacetFilter(SearchRequest $request): string
    {
        $parts = ['status = "active"'];

        if ($colors = $request->input('colors')) {
            $quoted  = implode(',', array_map(fn ($c) => '"' . addslashes($c) . '"', (array) $colors));
            $parts[] = "colors IN [{$quoted}]";
        }
        if ($sizes = $request->input('sizes')) {
            $quoted  = implode(',', array_map(fn ($s) => '"' . addslashes($s) . '"', (array) $sizes));
            $parts[] = "sizes IN [{$quoted}]";
        }
        if ($materials = $request->input('materials')) {
            $quoted  = implode(',', array_map(fn ($m) => '"' . addslashes($m) . '"', (array) $materials));
            $parts[] = "materials IN [{$quoted}]";
        }
        if ($request->boolean('in_stock'))    { $parts[] = 'in_stock = true'; }
        if ($request->boolean('has_discount')) { $parts[] = 'has_discount = true'; }

        if (($min = $request->input('price_min')) !== null) {
            $parts[] = 'lowest_variant_price_cents >= ' . (int) $min;
        }
        if (($max = $request->input('price_max')) !== null) {
            $parts[] = 'lowest_variant_price_cents <= ' . (int) $max;
        }
        if ($ratingMin = $request->input('rating_min')) {
            $parts[] = 'rating_average >= ' . (float) $ratingMin;
        }

        return implode(' AND ', $parts);
    }

    public function suggestions(string $query, int $limit = 8): array
    {
        if (strlen(trim($query)) < 2) {
            return [];
        }

        try {
            $raw = Product::search($query, function ($meiliSearch, string $q, array $options) use ($limit) {
                $options['filter']               = 'status = "active"';
                $options['hitsPerPage']          = $limit;
                $options['attributesToRetrieve'] = ['name', 'slug', 'brand_name'];
                $options['attributesToSearchOn'] = ['name', 'brand_name', 'category_names'];

                return $meiliSearch->search($q, $options);
            })->raw();
        } catch (\Throwable) {
            return [];
        }

        return collect($raw['hits'] ?? [])
            ->map(fn ($h) => ['label' => $h['name'], 'slug' => $h['slug']])
            ->take($limit)
            ->values()
            ->all();
    }

    // ── Filter expression builder ─────────────────────────────────────────────

    public function buildFilterExpression(SearchRequest $request): string
    {
        $parts = ['status = "active"'];

        if ($categoryIds = $request->input('categories')) {
            $ids = implode(',', array_map('intval', (array) $categoryIds));
            $parts[] = "category_ids IN [{$ids}]";
        }

        if ($brandIds = $request->input('brand_ids')) {
            $ids = implode(',', array_map('intval', (array) $brandIds));
            $parts[] = "brand_id IN [{$ids}]";
        }

        if ($colors = $request->input('colors')) {
            $quoted = implode(',', array_map(fn ($c) => '"' . addslashes($c) . '"', (array) $colors));
            $parts[] = "colors IN [{$quoted}]";
        }

        if ($sizes = $request->input('sizes')) {
            $quoted = implode(',', array_map(fn ($s) => '"' . addslashes($s) . '"', (array) $sizes));
            $parts[] = "sizes IN [{$quoted}]";
        }

        if ($materials = $request->input('materials')) {
            $quoted = implode(',', array_map(fn ($m) => '"' . addslashes($m) . '"', (array) $materials));
            $parts[] = "materials IN [{$quoted}]";
        }

        if ($request->boolean('in_stock')) {
            $parts[] = 'in_stock = true';
        }

        if ($request->boolean('has_discount')) {
            $parts[] = 'has_discount = true';
        }

        $priceMin = $request->input('price_min');
        $priceMax = $request->input('price_max');

        if ($priceMin !== null) {
            $parts[] = 'lowest_variant_price_cents >= ' . (int) $priceMin;
        }
        if ($priceMax !== null) {
            $parts[] = 'lowest_variant_price_cents <= ' . (int) $priceMax;
        }

        if ($ratingMin = $request->input('rating_min')) {
            $parts[] = 'rating_average >= ' . (float) $ratingMin;
        }

        return implode(' AND ', $parts);
    }

    // ── Sort expression builder ───────────────────────────────────────────────

    public function buildSortExpression(string $sort): array
    {
        return match ($sort) {
            'price_asc'  => ['lowest_variant_price_cents:asc'],
            'price_desc' => ['lowest_variant_price_cents:desc'],
            'newest'     => ['created_at:desc'],
            'rating'     => ['rating_average:desc'],
            'featured'   => ['is_featured:desc', 'created_at:desc'],
            default      => [],
        };
    }

    // ── Response formatter ────────────────────────────────────────────────────

    private function formatResults(array $raw, int $page): array
    {
        $hits = collect($raw['hits'] ?? []);

        $facetDist  = $raw['facetDistribution'] ?? [];
        $facetStats = $raw['facetStats'] ?? [];

        return [
            'hits' => $hits->all(),
            'pagination' => [
                'page'         => $raw['page'] ?? $page,
                'hitsPerPage'  => $raw['hitsPerPage'] ?? self::PER_PAGE,
                'totalHits'    => $raw['totalHits'] ?? 0,
                'totalPages'   => $raw['totalPages'] ?? 1,
            ],
            'facets' => [
                'categories'  => $this->formatCategoryFacets($facetDist['category_ids'] ?? []),
                'brands'      => $this->formatBrandFacets($facetDist['brand_id'] ?? []),
                'colors'      => $facetDist['colors'] ?? [],
                'sizes'       => $facetDist['sizes'] ?? [],
                'materials'   => $facetDist['materials'] ?? [],
                'in_stock'    => ($facetDist['in_stock'] ?? [])['true'] ?? 0,
                'has_discount' => ($facetDist['has_discount'] ?? [])['true'] ?? 0,
                'price_min'   => isset($facetStats['lowest_variant_price_cents']['min'])
                    ? (int) $facetStats['lowest_variant_price_cents']['min']
                    : 0,
                'price_max'   => isset($facetStats['lowest_variant_price_cents']['max'])
                    ? (int) $facetStats['lowest_variant_price_cents']['max']
                    : 0,
            ],
        ];
    }

    private function formatCategoryFacets(array $idCounts): array
    {
        if (empty($idCounts)) {
            return [];
        }
        $categories = Category::whereIn('id', array_keys($idCounts))->pluck('name', 'id');

        return collect($idCounts)->map(fn ($count, $id) => [
            'id'    => (int) $id,
            'name'  => $categories[$id] ?? "Category {$id}",
            'count' => $count,
        ])->values()->all();
    }

    private function formatBrandFacets(array $idCounts): array
    {
        if (empty($idCounts)) {
            return [];
        }
        $brands = Brand::whereIn('id', array_keys($idCounts))->pluck('name', 'id');

        return collect($idCounts)->map(fn ($count, $id) => [
            'id'    => (int) $id,
            'name'  => $brands[$id] ?? "Brand {$id}",
            'count' => $count,
        ])->values()->all();
    }
}
