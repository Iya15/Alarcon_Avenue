<?php

namespace App\Listeners;

use App\Events\OrderPlaced;
use Illuminate\Support\Facades\Log;

class SendOrderConfirmationEmail
{
    public function handle(OrderPlaced $event): void
    {
        // TODO (M9): Replace with a real Mailable.
        // For now, log so the event pipeline is wired and testable.
        Log::info('Order placed — confirmation email queued', [
            'order_number' => $event->order->order_number,
            'email'        => $event->order->user?->email ?? $event->order->guest_email,
        ]);
    }
}
