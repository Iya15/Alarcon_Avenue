<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AnalyticsExportRequest;
use App\Models\DailyProductStats;
use App\Models\DailySalesSummary;
use App\Models\DailyTrafficSummary;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AnalyticsController extends Controller
{
    public function dashboard(Request $request): Response
    {
        [$from, $to] = $this->dateRange($request);

        $sales = DailySalesSummary::whereBetween('date', [$from, $to])
            ->orderBy('date')
            ->get();

        $traffic = DailyTrafficSummary::whereBetween('date', [$from, $to])
            ->orderBy('date')
            ->get();

        $topProducts = DailyProductStats::with('product:id,name,slug')
            ->whereBetween('date', [$from, $to])
            ->selectRaw('product_id, SUM(units_sold) as total_units, SUM(revenue_cents) as total_revenue')
            ->groupBy('product_id')
            ->orderByDesc('total_revenue')
            ->limit(10)
            ->get();

        $totalOrders  = $sales->sum('orders_count');
        $totalSessions = $traffic->sum('sessions');
        $totalGross   = $sales->sum('gross_cents');
        $totalRefunds = $sales->sum('refunds_cents');
        $aov          = $totalOrders > 0 ? (int) round($totalGross / $totalOrders) : 0;
        $conversion   = $totalSessions > 0 ? round($totalOrders / $totalSessions * 100, 2) : 0;

        $newCustomers = User::whereBetween('created_at', [$from . ' 00:00:00', $to . ' 23:59:59'])->count();

        return Inertia::render('Admin/Dashboard', [
            'range'       => ['from' => $from, 'to' => $to, 'preset' => $request->input('preset', '30')],
            'summary'     => [
                'total_orders'   => $totalOrders,
                'gross_cents'    => $totalGross,
                'net_cents'      => $sales->sum('net_cents'),
                'refunds_cents'  => $totalRefunds,
                'items_sold'     => $sales->sum('items_sold'),
                'aov_cents'      => $aov,
                'conversion_pct' => $conversion,
                'new_customers'  => $newCustomers,
            ],
            'revenue_chart' => $sales->map(fn ($s) => [
                'date'        => $s->date->toDateString(),
                'gross_cents' => $s->gross_cents,
                'net_cents'   => $s->net_cents,
            ])->values(),
            'orders_chart' => $sales->map(fn ($s) => [
                'date'         => $s->date->toDateString(),
                'orders_count' => $s->orders_count,
            ])->values(),
            'traffic_chart' => $traffic->map(fn ($t) => [
                'date'          => $t->date->toDateString(),
                'sessions'      => $t->sessions,
                'product_views' => $t->product_views,
            ])->values(),
            'top_products' => $topProducts->map(fn ($p) => [
                'product_id'    => $p->product_id,
                'product_name'  => $p->product?->name ?? 'Deleted product',
                'total_units'   => (int) $p->total_units,
                'total_revenue' => (int) $p->total_revenue,
            ])->values(),
        ]);
    }

    public function exportSales(AnalyticsExportRequest $request): StreamedResponse
    {
        [$from, $to] = $this->dateRange($request);

        $rows = DailySalesSummary::whereBetween('date', [$from, $to])->orderBy('date')->get();

        return response()->streamDownload(function () use ($rows) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['date', 'orders_count', 'gross_cents', 'net_cents', 'refunds_cents', 'items_sold']);
            foreach ($rows as $r) {
                fputcsv($out, [$r->date->toDateString(), $r->orders_count, $r->gross_cents, $r->net_cents, $r->refunds_cents, $r->items_sold]);
            }
            fclose($out);
        }, "sales-{$from}-{$to}.csv", ['Content-Type' => 'text/csv']);
    }

    public function exportProducts(AnalyticsExportRequest $request): StreamedResponse
    {
        [$from, $to] = $this->dateRange($request);

        $rows = DailyProductStats::with('product:id,name')
            ->whereBetween('date', [$from, $to])
            ->orderBy('date')
            ->get();

        return response()->streamDownload(function () use ($rows) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['date', 'product_id', 'product_name', 'units_sold', 'revenue_cents']);
            foreach ($rows as $r) {
                fputcsv($out, [$r->date->toDateString(), $r->product_id, $r->product?->name ?? '', $r->units_sold, $r->revenue_cents]);
            }
            fclose($out);
        }, "products-{$from}-{$to}.csv", ['Content-Type' => 'text/csv']);
    }

    private function dateRange(Request $request): array
    {
        $preset = (int) $request->input('preset', 30);
        $to     = $request->input('to', Carbon::today()->toDateString());
        $from   = $request->input('from', Carbon::today()->subDays($preset - 1)->toDateString());

        return [$from, $to];
    }
}
