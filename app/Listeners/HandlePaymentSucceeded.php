<?php

namespace App\Listeners;

use App\Enums\OrderStatus;
use App\Events\OrderPaid;
use App\Events\PaymentSucceeded;
use App\Events\StockUpdated;
use App\Models\Inventory;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;

class HandlePaymentSucceeded
{
    public function handle(PaymentSucceeded $event): void
    {
        $order   = $event->order;
        $payment = $event->payment;

        // Skip if already paid (idempotent)
        if ($order->status === OrderStatus::Paid) {
            return;
        }

        DB::transaction(function () use ($order, $payment) {
            // 1. Mark payment captured
            $payment->update([
                'status'      => Payment::STATUS_CAPTURED,
                'captured_at' => now(),
            ]);

            // 2. Transition order to Paid
            $order->markPaid();

            // 3. Decrement actual stock (two-phase: reserved → confirmed gone)
            $order->load('items');
            foreach ($order->items as $item) {
                Inventory::where('product_variant_id', $item->product_variant_id)
                    ->decrement('quantity', $item->quantity);
                Inventory::where('product_variant_id', $item->product_variant_id)
                    ->decrement('reserved_quantity', $item->quantity);
            }

            // 4. Broadcast updated stock levels for each affected variant
            $variantIds = $order->items->pluck('product_variant_id')->unique();
            foreach ($variantIds as $variantId) {
                $inv = Inventory::where('product_variant_id', $variantId)->first();
                if ($inv) {
                    event(new StockUpdated($inv->load('variant')));
                }
            }
        });

        // 4. Fire downstream event (email, analytics) outside transaction
        event(new OrderPaid($order->fresh()));
    }
}
