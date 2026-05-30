<?php

namespace App\Http\Controllers\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Requests\SearchRequest;
use App\Models\Brand;
use App\Models\Category;
use App\Services\SearchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class SearchController extends Controller
{
    public function __construct(private readonly SearchService $search) {}

    public function index(SearchRequest $request): Response
    {
        $results = $this->search->search($request);

        return Inertia::render('Search/Index', [
            'query'   => $request->input('q', ''),
            'filters' => $request->activeFilters(),
            'results' => $results['hits'],
            'pagination' => $results['pagination'],
            'facets'  => $results['facets'],
            'brands'  => fn () => Brand::where('is_active', true)->orderBy('name')->get(['id', 'name', 'slug']),
            'categories' => fn () => Category::with('children')
                ->whereNull('parent_id')
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->get(['id', 'parent_id', 'name', 'slug']),
        ]);
    }

    public function suggestions(Request $request): JsonResponse
    {
        $q = trim($request->input('q', ''));

        if (strlen($q) < 2) {
            return response()->json([]);
        }

        $results = Cache::remember("search_suggestions:{$q}", 60, fn () =>
            $this->search->suggestions($q, 8)
        );

        return response()->json($results);
    }

    public function trending(): JsonResponse
    {
        $trending = Cache::remember('search_trending', 3600, function () {
            return [
                'shirt', 'sneakers', 'watch', 'backpack', 'dress',
                'jacket', 'jeans', 'sunglasses', 'bag', 'shoes',
            ];
        });

        return response()->json($trending);
    }
}
