<?php

namespace App\Actions;

use App\Models\Category;
use App\Models\DailyProductStats;
use App\Models\Order;
use App\Models\Product;
use App\Models\RecentlyViewed;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Returns homepage product data tailored to the current user.
 *
 * Authed users: categories are ranked by their recent views + purchases
 * (last 60 days). Products surfaced are the top-rated active items from
 * those categories. Cold-start / guests fall through to global best-sellers.
 *
 * The "best-sellers" fallback is derived from DailyProductStats (units_sold
 * over 30 days), which is the same pre-aggregated table the admin dashboard
 * uses — no extra query cost.
 */
class GetPersonalizedHomepageAction
{
    private const LOOK_BACK_DAYS    = 60;
    private const FEATURED_LIMIT    = 12;
    private const BESTSELLER_LIMIT  = 12;
    private const CATEGORY_LIMIT    = 3; // top N categories for personalization

    public function execute(?User $user): array
    {
        $featured    = $this->featuredProducts();
        $bestsellers = $this->bestSellers();
        $personalized = [];
        $topCategories = [];

        if ($user) {
            // Per-user personalization cached for 30 minutes; busted on new order/view
            [$topCategories, $personalized] = Cache::remember(
                "homepage.personalized.user.{$user->id}",
                1800,
                fn () => $this->personalizedForUser($user)
            );
        }

        return [
            'featured'      => $featured,
            'bestsellers'   => $bestsellers,
            'personalized'  => $personalized,   // empty for guests
            'top_categories' => $topCategories, // empty for guests
        ];
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private function featuredProducts(): Collection
    {
        return Cache::remember('homepage.featured', 3600, fn () =>
            Product::with(['primaryImage', 'variants.inventory'])
                ->where('status', 'active')
                ->where('is_featured', true)
                ->orderByDesc('updated_at')
                ->limit(self::FEATURED_LIMIT)
                ->get()
        );
    }

    /**
     * Global best-sellers: rank active products by units sold in the last 30 days
     * from the pre-aggregated daily_product_stats table.
     */
    private function bestSellers(): Collection
    {
        // Cache bestsellers for 1 hour — stale-while-revalidate is fine for this rail
        return Cache::remember('homepage.bestsellers', 3600, function () {
            $cutoff = Carbon::now()->subDays(30)->toDateString();

            $topIds = DailyProductStats::select('product_id', DB::raw('SUM(units_sold) as total_sold'))
                ->where('date', '>=', $cutoff)
                ->groupBy('product_id')
                ->orderByDesc('total_sold')
                ->limit(self::BESTSELLER_LIMIT * 2)
                ->pluck('product_id')
                ->all();

            if (empty($topIds)) {
                return Product::with(['primaryImage', 'variants.inventory'])
                    ->where('status', 'active')
                    ->orderByDesc('rating_average')
                    ->orderByDesc('review_count')
                    ->limit(self::BESTSELLER_LIMIT)
                    ->get();
            }

            return Product::with(['primaryImage', 'variants.inventory'])
                ->where('status', 'active')
                ->whereIn('id', $topIds)
                ->orderByRaw('ARRAY_POSITION(ARRAY[' . implode(',', $topIds) . ']::int[], id)')
                ->limit(self::BESTSELLER_LIMIT)
                ->get();
        });
    }

    /**
     * For an authed user: rank categories by their interaction weight,
     * then surface top products from those categories.
     *
     * Returns [$topCategories, $personalizedProducts].
     */
    private function personalizedForUser(User $user): array
    {
        $cutoff = Carbon::now()->subDays(self::LOOK_BACK_DAYS);

        // ── Signal 1: recently viewed (RecentlyViewed model) ──────────────────
        $viewedProductIds = RecentlyViewed::where('user_id', $user->id)
            ->where('viewed_at', '>=', $cutoff)
            ->pluck('product_id')
            ->all();

        // ── Signal 2: purchased products ──────────────────────────────────────
        $purchasedProductIds = Order::where('user_id', $user->id)
            ->where('status', 'paid')
            ->where('paid_at', '>=', $cutoff)
            ->with('items')
            ->get()
            ->flatMap(fn ($o) => $o->items->pluck('product_id'))
            ->unique()
            ->all();

        $allInteractedIds = array_unique(array_merge($viewedProductIds, $purchasedProductIds));

        if (empty($allInteractedIds)) {
            return [[], []]; // cold start — caller falls back to bestsellers
        }

        // ── Score categories: purchase = 2 pts, view = 1 pt ──────────────────
        $viewedCategoryIds   = $this->categoryIdsForProducts($viewedProductIds);
        $purchasedCategoryIds = $this->categoryIdsForProducts($purchasedProductIds);

        $categoryScores = [];
        foreach ($viewedCategoryIds as $catId) {
            $categoryScores[$catId] = ($categoryScores[$catId] ?? 0) + 1;
        }
        foreach ($purchasedCategoryIds as $catId) {
            $categoryScores[$catId] = ($categoryScores[$catId] ?? 0) + 2;
        }

        if (empty($categoryScores)) {
            return [[], []];
        }

        arsort($categoryScores);
        $topCatIds = array_slice(array_keys($categoryScores), 0, self::CATEGORY_LIMIT, true);

        $topCategories = Category::whereIn('id', $topCatIds)
            ->where('is_active', true)
            ->get()
            ->keyBy('id')
            ->sortBy(fn ($cat) => array_search($cat->id, $topCatIds))
            ->values()
            ->all();

        // ── Surface top-rated active products from those categories ───────────
        $personalized = Product::with(['primaryImage', 'variants.inventory', 'categories'])
            ->where('status', 'active')
            ->whereHas('categories', fn ($q) => $q->whereIn('categories.id', $topCatIds))
            ->orderByDesc('rating_average')
            ->orderByDesc('review_count')
            ->limit(self::FEATURED_LIMIT)
            ->get();

        return [$topCategories, $personalized];
    }

    private function categoryIdsForProducts(array $productIds): array
    {
        if (empty($productIds)) {
            return [];
        }

        return DB::table('category_product')
            ->whereIn('product_id', $productIds)
            ->pluck('category_id')
            ->all();
    }
}
