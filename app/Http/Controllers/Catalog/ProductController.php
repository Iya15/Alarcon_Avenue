<?php

namespace App\Http\Controllers\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductCardResource;
use App\Http\Resources\ProductDetailResource;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        $products = Product::with(['primaryImage', 'variants.inventory', 'categories'])
            ->where('status', 'active')
            ->when($request->input('sort') === 'price_asc',  fn ($q) => $q->orderBy('base_price_cents'))
            ->when($request->input('sort') === 'price_desc', fn ($q) => $q->orderByDesc('base_price_cents'))
            ->when($request->input('sort') === 'newest',     fn ($q) => $q->orderByDesc('created_at'))
            ->when($request->input('sort') === 'featured',   fn ($q) => $q->orderByDesc('is_featured'))
            ->when(! $request->input('sort'),                fn ($q) => $q->orderByDesc('created_at'))
            ->paginate(24)
            ->withQueryString();

        return Inertia::render('Products/Index', [
            'products'   => $products->through(fn ($p) => (new ProductCardResource($p))->resolve()),
            'categories' => $this->categoryTree(),
            'filters'    => ['sort' => $request->input('sort')],
            'title'      => 'All Products',
        ]);
    }

    public function show(string $slug): Response
    {
        $product = Product::query()
            ->where('slug', $slug)
            ->where('status', 'active')
            ->with([
                'categories',
                'images',
                'variants.attributeValues.attribute',
                'variants.inventory',
                'variants.images',
                'publishedReviews.user',
                'publishedReviews.media',
            ])
            ->firstOrFail();

        // Use precomputed recommendations; fall back to same-category if table is empty
        $recIds = $product->recommendations()
            ->with('recommended')
            ->limit(6)
            ->get()
            ->pluck('recommended_product_id')
            ->all();

        if (! empty($recIds)) {
            $related = Product::with(['primaryImage', 'variants.inventory'])
                ->where('status', 'active')
                ->whereIn('id', $recIds)
                ->orderByRaw('ARRAY_POSITION(ARRAY[' . implode(',', $recIds) . ']::int[], id)')
                ->get();

            $relatedReasons = $product->recommendations()
                ->limit(6)
                ->get()
                ->pluck('reason', 'recommended_product_id')
                ->all();
        } else {
            $related = Product::with(['primaryImage', 'variants.inventory'])
                ->where('status', 'active')
                ->where('id', '!=', $product->id)
                ->whereHas('categories', fn ($q) => $q->whereIn('categories.id', $product->categories->pluck('id')))
                ->inRandomOrder()
                ->limit(6)
                ->get();
            $relatedReasons = [];
        }

        $relatedResolved = ProductCardResource::collection($related)->resolve();
        // Attach reason label to each card so the frontend can display "Bought together" etc.
        foreach ($relatedResolved as &$card) {
            $card['recommendation_reason'] = $relatedReasons[$card['id']] ?? null;
        }
        unset($card);

        return Inertia::render('Products/Show', [
            'product'        => (new ProductDetailResource($product))->resolve(),
            'relatedProducts' => $relatedResolved,
        ]);
    }

    private function categoryTree(): array
    {
        $categories = Cache::remember('categories.tree', 3600, fn () =>
            Category::with('children')
                ->whereNull('parent_id')
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->get()
        );

        return CategoryResource::collection($categories)->resolve();
    }
}
