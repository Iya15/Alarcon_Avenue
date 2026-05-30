<?php

namespace App\Listeners;

use App\Enums\OrderStatus;
use App\Events\PaymentFailed;
use App\Models\Inventory;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;

class HandlePaymentFailed
{
    public function handle(PaymentFailed $event): void
    {
        $order   = $event->order;
        $payment = $event->payment;

        // Skip if already in a terminal state
        if ($order->status->isFinal()) {
            return;
        }

        DB::transaction(function () use ($order, $payment) {
            $payment->update([
                'status'    => Payment::STATUS_FAILED,
                'failed_at' => now(),
            ]);

            // Release reserved stock — guard against going below zero
            $order->load('items');
            foreach ($order->items as $item) {
                $inv = Inventory::where('product_variant_id', $item->product_variant_id)->first();
                if ($inv) {
                    $inv->update([
                        'reserved_quantity' => max(0, $inv->reserved_quantity - $item->quantity),
                    ]);
                }
            }

            // Return order to pending so the customer can retry
            $order->update(['status' => OrderStatus::Pending]);
        });
    }
}
