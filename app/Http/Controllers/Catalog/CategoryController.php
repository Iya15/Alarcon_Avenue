<?php

namespace App\Http\Controllers\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\ProductCardResource;
use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function show(string $slug, Request $request): Response
    {
        $category = Category::with(['children', 'parent'])
            ->where('slug', $slug)
            ->where('is_active', true)
            ->firstOrFail();

        $descendantIds = $this->descendantIds($category);

        $products = \App\Models\Product::with(['primaryImage', 'variants.inventory', 'categories'])
            ->where('status', 'active')
            ->whereHas('categories', fn ($q) => $q->whereIn('categories.id', $descendantIds))
            ->when($request->input('sort') === 'price_asc',  fn ($q) => $q->orderBy('base_price_cents'))
            ->when($request->input('sort') === 'price_desc', fn ($q) => $q->orderByDesc('base_price_cents'))
            ->when($request->input('sort') === 'newest',     fn ($q) => $q->orderByDesc('created_at'))
            ->when(! $request->input('sort'),                fn ($q) => $q->orderByDesc('created_at'))
            ->paginate(24)
            ->withQueryString();

        return Inertia::render('Products/Index', [
            'products'   => $products->through(fn ($p) => (new ProductCardResource($p))->resolve()),
            'category'   => (new CategoryResource($category->load('parent')))->resolve(),
            'categories' => CategoryResource::collection(
                Category::with('children')->whereNull('parent_id')->where('is_active', true)->orderBy('sort_order')->get()
            )->resolve(),
            'filters'    => ['sort' => $request->input('sort')],
            'title'      => $category->name,
        ]);
    }

    private function descendantIds(Category $category): array
    {
        $ids = [$category->id];

        $children = Category::where('parent_id', $category->id)->get();
        foreach ($children as $child) {
            $ids = array_merge($ids, $this->descendantIds($child));
        }

        return $ids;
    }
}
