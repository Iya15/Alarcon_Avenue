<?php

namespace App\Listeners;

use App\Enums\OrderStatus;
use App\Events\OrderStatusUpdated;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class UpdateSalesSummaryOnOrderComplete
{
    public function handle(OrderStatusUpdated $event): void
    {
        if ($event->newStatus !== OrderStatus::Delivered) {
            return;
        }

        $date = Carbon::today()->toDateString();

        // Ensure a row exists for today before incrementing
        DB::table('daily_sales_summaries')->insertOrIgnore([
            'date'            => $date,
            'completed_count' => 0,
            'orders_count'    => 0,
            'gross_cents'     => 0,
            'net_cents'       => 0,
            'refunds_cents'   => 0,
            'items_sold'      => 0,
        ]);

        DB::table('daily_sales_summaries')
            ->where('date', $date)
            ->increment('completed_count');
    }
}
