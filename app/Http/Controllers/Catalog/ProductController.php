<?php

namespace App\Http\Controllers\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductCardResource;
use App\Http\Resources\ProductDetailResource;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;
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
            'products'   => ProductCardResource::collection($products),
            'categories' => $this->categoryTree(),
            'filters'    => $request->only('sort'),
            'title'      => 'All Products',
        ]);
    }

    public function show(string $slug): Response
    {
        $product = Product::where('slug', $slug)
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

        $related = Product::with(['primaryImage', 'variants.inventory'])
            ->where('status', 'active')
            ->where('id', '!=', $product->id)
            ->whereHas('categories', fn ($q) => $q->whereIn('categories.id', $product->categories->pluck('id')))
            ->inRandomOrder()
            ->limit(6)
            ->get();

        return Inertia::render('Products/Show', [
            'product'        => (new ProductDetailResource($product))->resolve(),
            'relatedProducts' => ProductCardResource::collection($related)->resolve(),
        ]);
    }

    private function categoryTree(): array
    {
        return CategoryResource::collection(
            Category::with('children')
                ->whereNull('parent_id')
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->get()
        )->resolve();
    }
}
