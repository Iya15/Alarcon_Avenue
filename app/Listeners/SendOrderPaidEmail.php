<?php

namespace App\Listeners;

use App\Events\OrderPaid;
use Illuminate\Support\Facades\Log;

class SendOrderPaidEmail
{
    public function handle(OrderPaid $event): void
    {
        // TODO (M9): Send real payment confirmation email via Mailable.
        Log::info('Order paid — confirmation email queued.', [
            'order_number' => $event->order->order_number,
        ]);
    }
}
