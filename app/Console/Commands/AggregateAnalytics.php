<?php

namespace App\Console\Commands;

use App\Models\AnalyticsEvent;
use App\Models\DailyProductStats;
use App\Models\DailySalesSummary;
use App\Models\DailyTrafficSummary;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Refund;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Tradeoff: summary tables have eventual-consistency lag of up to the job interval
 * (default: every 15 minutes in production). The dashboard reads only these tables,
 * so page load is O(days-in-range) instead of O(all-orders), which is the point.
 * Today's row is rebuilt incrementally on each run; past rows are backfilled once if missing.
 */
class AggregateAnalytics extends Command
{
    protected $signature   = 'analytics:aggregate {--days=1 : Number of past days to rebuild (use 0 for today only)}';
    protected $description = 'Rebuild daily analytics summary tables from raw order and event data';

    public function handle(): int
    {
        $days = (int) $this->option('days');

        $dates = collect(range(0, $days))->map(
            fn ($offset) => Carbon::today()->subDays($offset)->toDateString()
        );

        foreach ($dates as $date) {
            $this->aggregateSales($date);
            $this->aggregateProducts($date);
            $this->aggregateTraffic($date);
            $this->line("Aggregated {$date}");
        }

        // Backfill any missing historical days (first run / gaps)
        $this->backfillMissing();

        return self::SUCCESS;
    }

    private function aggregateSales(string $date): void
    {
        $orders = Order::whereDate('paid_at', $date)->get();

        $gross   = $orders->sum('total_cents');
        $refunds = Refund::whereHas('order', fn ($q) => $q->whereDate('paid_at', $date))
            ->whereDate('created_at', $date)
            ->sum('amount_cents');
        $items   = OrderItem::whereHas('order', fn ($q) => $q->whereDate('paid_at', $date))
            ->sum('quantity');

        DailySalesSummary::updateOrCreate(
            ['date' => $date],
            [
                'orders_count'  => $orders->count(),
                'gross_cents'   => $gross,
                'net_cents'     => max(0, $gross - $refunds),
                'refunds_cents' => $refunds,
                'items_sold'    => (int) $items,
            ]
        );
    }

    private function aggregateProducts(string $date): void
    {
        $rows = OrderItem::select(
                'product_id',
                DB::raw('SUM(quantity) as units_sold'),
                DB::raw('SUM(subtotal_cents) as revenue_cents')
            )
            ->whereHas('order', fn ($q) => $q->whereDate('paid_at', $date))
            ->groupBy('product_id')
            ->get();

        foreach ($rows as $row) {
            DailyProductStats::updateOrCreate(
                ['date' => $date, 'product_id' => $row->product_id],
                ['units_sold' => $row->units_sold, 'revenue_cents' => $row->revenue_cents]
            );
        }
    }

    private function aggregateTraffic(string $date): void
    {
        $sessions = AnalyticsEvent::whereDate('created_at', $date)
            ->distinct('session_id')
            ->count('session_id');

        $views = AnalyticsEvent::whereDate('created_at', $date)
            ->where('event_name', 'product_view')
            ->count();

        DailyTrafficSummary::updateOrCreate(
            ['date' => $date],
            ['sessions' => $sessions, 'product_views' => $views]
        );
    }

    private function backfillMissing(): void
    {
        // Find the earliest paid_at date in the system
        $earliest = Order::whereNotNull('paid_at')->min('paid_at');
        if (! $earliest) {
            return;
        }

        $start = Carbon::parse($earliest)->toDateString();
        $end   = Carbon::yesterday()->toDateString();

        $existing = DailySalesSummary::whereBetween('date', [$start, $end])
            ->pluck('date')
            ->map(fn ($d) => Carbon::parse($d)->toDateString())
            ->all();

        $period = Carbon::parse($start)->daysUntil($end);
        foreach ($period as $day) {
            $dateStr = $day->toDateString();
            if (! in_array($dateStr, $existing)) {
                $this->aggregateSales($dateStr);
                $this->aggregateProducts($dateStr);
                $this->aggregateTraffic($dateStr);
            }
        }
    }
}
