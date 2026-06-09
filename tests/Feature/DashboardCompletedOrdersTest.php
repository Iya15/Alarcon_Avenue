<?php

use App\Enums\OrderStatus;
use App\Events\OrderStatusUpdated;
use App\Models\DailySalesSummary;
use App\Models\Order;
use Illuminate\Support\Carbon;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

it('increments completed_count in daily_sales_summaries when an order is marked delivered', function () {
    $today = Carbon::today()->toDateString();

    // Seed today's summary row
    DailySalesSummary::create([
        'date'            => $today,
        'orders_count'    => 3,
        'completed_count' => 0,
        'gross_cents'     => 300000,
        'net_cents'       => 300000,
        'refunds_cents'   => 0,
        'items_sold'      => 3,
    ]);

    $order = Order::factory()->create(['status' => OrderStatus::Paid]);

    // Fire the event as the controller would
    OrderStatusUpdated::dispatch($order, OrderStatus::Paid, OrderStatus::Delivered);

    $summary = DailySalesSummary::where('date', $today)->first();
    expect($summary->completed_count)->toBe(1);
});

it('does not increment completed_count for non-delivered status transitions', function () {
    $today = Carbon::today()->toDateString();

    DailySalesSummary::create([
        'date'            => $today,
        'orders_count'    => 3,
        'completed_count' => 0,
        'gross_cents'     => 300000,
        'net_cents'       => 300000,
        'refunds_cents'   => 0,
        'items_sold'      => 3,
    ]);

    $order = Order::factory()->create(['status' => OrderStatus::Pending]);

    OrderStatusUpdated::dispatch($order, OrderStatus::Pending, OrderStatus::Processing);

    $summary = DailySalesSummary::where('date', $today)->first();
    expect($summary->completed_count)->toBe(0);
});

it('creates a summary row for today if none exists when order is delivered', function () {
    $today = Carbon::today()->toDateString();

    // No pre-existing row
    expect(DailySalesSummary::where('date', $today)->exists())->toBeFalse();

    $order = Order::factory()->create(['status' => OrderStatus::Shipped]);
    OrderStatusUpdated::dispatch($order, OrderStatus::Shipped, OrderStatus::Delivered);

    expect(DailySalesSummary::where('date', $today)->value('completed_count'))->toBe(1);
});
