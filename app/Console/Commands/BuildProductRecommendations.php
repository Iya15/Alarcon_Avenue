<?php

namespace App\Console\Commands;

use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Builds the product_recommendations table from three signals:
 *
 *  1. Co-purchase: products appearing together in the same paid order (last 90 days).
 *     Weight 2.0 — intentional, high-confidence signal.
 *
 *  2. Co-view: products viewed in the same browser session (last 30 days).
 *     Weight 1.0 — weaker signal but reflects interest.
 *
 *  3. Category affinity fallback: same-category products sorted by popularity.
 *     Used when fewer than MIN_RECS_PER_PRODUCT co-occurrence recs exist.
 *
 * The 'reason' column is auditable: 'bought_together' wins over 'viewed_together'
 * when both signals apply to the same pair.
 */
class BuildProductRecommendations extends Command
{
    protected $signature   = 'recommendations:build';
    protected $description = 'Rebuild product recommendations from co-purchase, co-view, and category affinity signals';

    private const CO_PURCHASE_WEIGHT     = 2.0;
    private const CO_VIEW_WEIGHT         = 1.0;
    private const CO_PURCHASE_DAYS       = 90;
    private const CO_VIEW_DAYS           = 30;
    private const MIN_RECS_PER_PRODUCT   = 6;
    private const TOP_N_PER_PRODUCT      = 10;
    private const INSERT_CHUNK_SIZE      = 500;

    public function handle(): int
    {
        $this->line('Building co-purchase scores (last ' . self::CO_PURCHASE_DAYS . ' days)…');
        $coPurchase = $this->buildCoPurchaseScores();
        $this->line('  → ' . count($coPurchase) . ' products with purchase co-occurrence.');

        $this->line('Building co-view scores (last ' . self::CO_VIEW_DAYS . ' days)…');
        $coView = $this->buildCoViewScores();
        $this->line('  → ' . count($coView) . ' products with view co-occurrence.');

        $this->line('Merging signals and writing to product_recommendations…');
        $written = $this->writeRecommendations($coPurchase, $coView);
        $this->info("Done — {$written} recommendation rows written.");

        return self::SUCCESS;
    }

    /**
     * Returns: array<product_id, array<recommended_product_id, float>>
     * Co-purchase pairs from paid orders in the last CO_PURCHASE_DAYS.
     */
    private function buildCoPurchaseScores(): array
    {
        $cutoff = Carbon::now()->subDays(self::CO_PURCHASE_DAYS)->toDateTimeString();

        // Self-join order_items within the same paid order; only keep a < b pairs
        // to avoid double-counting, then we symmetrize in PHP.
        $rows = DB::select(<<<SQL
            SELECT
                a.product_id,
                b.product_id AS recommended_product_id,
                COUNT(*) AS pair_count
            FROM order_items a
            JOIN order_items b
                ON a.order_id = b.order_id
               AND a.product_id < b.product_id
            JOIN orders o ON o.id = a.order_id
            WHERE o.status = 'paid'
              AND o.paid_at >= ?
            GROUP BY a.product_id, b.product_id
        SQL, [$cutoff]);

        $scores = [];
        foreach ($rows as $row) {
            $a     = $row->product_id;
            $b     = $row->recommended_product_id;
            $delta = $row->pair_count * self::CO_PURCHASE_WEIGHT;
            // Symmetric: A→B and B→A
            $scores[$a][$b] = ($scores[$a][$b] ?? 0.0) + $delta;
            $scores[$b][$a] = ($scores[$b][$a] ?? 0.0) + $delta;
        }

        return $scores;
    }

    /**
     * Returns: array<product_id, array<recommended_product_id, float>>
     * Co-view pairs from analytics_events (product_view) in the same session
     * within the last CO_VIEW_DAYS. Require at least 2 co-occurrences to reduce noise.
     */
    private function buildCoViewScores(): array
    {
        $cutoff = Carbon::now()->subDays(self::CO_VIEW_DAYS)->toDateTimeString();

        $rows = DB::select(<<<SQL
            SELECT
                a.subject_id AS product_id,
                b.subject_id AS recommended_product_id,
                COUNT(*) AS pair_count
            FROM analytics_events a
            JOIN analytics_events b
                ON  a.session_id   = b.session_id
                AND a.subject_id   < b.subject_id
                AND a.subject_type = b.subject_type
            WHERE a.event_name    = 'product_view'
              AND b.event_name    = 'product_view'
              AND a.subject_type  = 'App\Models\Product'
              AND a.created_at   >= ?
            GROUP BY a.subject_id, b.subject_id
            HAVING COUNT(*) >= 2
        SQL, [$cutoff]);

        $scores = [];
        foreach ($rows as $row) {
            $a     = $row->product_id;
            $b     = $row->recommended_product_id;
            $delta = $row->pair_count * self::CO_VIEW_WEIGHT;
            $scores[$a][$b] = ($scores[$a][$b] ?? 0.0) + $delta;
            $scores[$b][$a] = ($scores[$b][$a] ?? 0.0) + $delta;
        }

        return $scores;
    }

    /**
     * Merge signals, fill thin results with category fallback, and write to the table.
     * Returns the number of rows written.
     */
    private function writeRecommendations(array $coPurchase, array $coView): int
    {
        // ── 1. Merge co-purchase + co-view into a single score map ───────────

        // $merged[$productId][$recId] = ['score' => float, 'has_purchase' => bool, 'has_view' => bool]
        $merged = [];

        foreach ($coPurchase as $productId => $recs) {
            foreach ($recs as $recId => $score) {
                $merged[$productId][$recId]['score']       = ($merged[$productId][$recId]['score'] ?? 0.0) + $score;
                $merged[$productId][$recId]['has_purchase'] = true;
            }
        }

        foreach ($coView as $productId => $recs) {
            foreach ($recs as $recId => $score) {
                $merged[$productId][$recId]['score']    = ($merged[$productId][$recId]['score'] ?? 0.0) + $score;
                $merged[$productId][$recId]['has_view'] = true;
            }
        }

        // ── 2. Load all active products for category fallback ─────────────────

        // Sorted by rating DESC so the category fallback is popularity-ranked.
        $allProducts = Product::where('status', 'active')
            ->with('categories')
            ->orderByDesc('rating_average')
            ->orderByDesc('review_count')
            ->get()
            ->keyBy('id');

        // category_id → [product_id, ...] (popularity order)
        $categoryProducts = [];
        foreach ($allProducts as $product) {
            foreach ($product->categories as $cat) {
                $categoryProducts[$cat->id][] = $product->id;
            }
        }

        // ── 3. Truncate old recommendations ───────────────────────────────────

        DB::table('product_recommendations')->truncate();

        // ── 4. Build and insert rows in chunks ────────────────────────────────

        $inserts = [];
        $now     = now()->toDateTimeString();
        $written = 0;

        foreach ($allProducts as $productId => $product) {
            $recs = $merged[$productId] ?? [];

            // Assign best auditable reason and collect rows for this product
            $toInsert = [];
            foreach ($recs as $recId => $data) {
                if (! isset($allProducts[$recId])) {
                    continue; // recommended product was deleted
                }
                $reason           = isset($data['has_purchase']) ? 'bought_together' : 'viewed_together';
                $toInsert[$recId] = ['score' => $data['score'], 'reason' => $reason];
            }

            // Sort by score descending and cap at TOP_N
            arsort($toInsert);
            $toInsert = array_slice($toInsert, 0, self::TOP_N_PER_PRODUCT, true);

            // ── Category affinity fallback when co-occurrence is thin ─────────
            if (count($toInsert) < self::MIN_RECS_PER_PRODUCT) {
                $excludeIds   = array_keys($toInsert);
                $excludeIds[] = $productId; // never recommend a product to itself

                foreach ($product->categories as $cat) {
                    foreach ($categoryProducts[$cat->id] ?? [] as $catProdId) {
                        if (in_array($catProdId, $excludeIds)) {
                            continue;
                        }
                        $toInsert[$catProdId] = ['score' => 0.1, 'reason' => 'similar_category'];
                        $excludeIds[]          = $catProdId;

                        if (count($toInsert) >= self::MIN_RECS_PER_PRODUCT) {
                            break 2;
                        }
                    }
                }
            }

            // ── Accumulate rows for batch insert ──────────────────────────────
            foreach ($toInsert as $recId => $data) {
                $inserts[] = [
                    'product_id'             => $productId,
                    'recommended_product_id' => $recId,
                    'score'                  => $data['score'],
                    'reason'                 => $data['reason'],
                    'created_at'             => $now,
                    'updated_at'             => $now,
                ];

                if (count($inserts) >= self::INSERT_CHUNK_SIZE) {
                    DB::table('product_recommendations')->insert($inserts);
                    $written += count($inserts);
                    $inserts  = [];
                }
            }
        }

        if (! empty($inserts)) {
            DB::table('product_recommendations')->insert($inserts);
            $written += count($inserts);
        }

        return $written;
    }
}
