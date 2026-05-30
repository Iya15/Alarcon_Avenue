<?php

namespace App\Actions\Payment;

use App\DTOs\PaymentEvent;
use App\Events\PaymentFailed;
use App\Events\PaymentSucceeded;
use App\Models\Order;
use App\Models\Payment;
use App\Models\ProcessedWebhook;
use Illuminate\Support\Facades\DB;

class HandleWebhookAction
{
    public function execute(PaymentEvent $event): void
    {
        // ── Idempotency check ─────────────────────────────────────────────────
        if (ProcessedWebhook::where('provider', $event->provider)
                ->where('event_id', $event->eventId)
                ->exists()
        ) {
            return; // already processed — safe to return 200 without re-processing
        }

        DB::transaction(function () use ($event) {
            $this->processEvent($event);

            ProcessedWebhook::create([
                'provider'     => $event->provider,
                'event_id'     => $event->eventId,
                'processed_at' => now(),
            ]);
        });
    }

    private function processEvent(PaymentEvent $event): void
    {
        // Find payment by gateway intent ID or transaction ID, or by order number
        $payment = Payment::where('gateway_payment_intent_id', $event->transactionId)
            ->orWhere('gateway_transaction_id', $event->transactionId)
            ->where('type', Payment::TYPE_CHARGE)
            ->first();

        if (! $payment && $event->orderReference) {
            $order   = Order::where('order_number', $event->orderReference)->first();
            $payment = $order?->payments()->where('type', Payment::TYPE_CHARGE)->latest()->first();
        }

        if (! $payment) {
            return; // Unknown payment — ignore silently (may be from another source)
        }

        $order = $payment->order;

        // Update gateway transaction ID if we now have one
        if ($event->transactionId && ! $payment->gateway_payment_intent_id) {
            $payment->update(['gateway_payment_intent_id' => $event->transactionId]);
        }

        match ($event->status) {
            'succeeded' => event(new PaymentSucceeded($order, $payment)),
            'failed'    => event(new PaymentFailed($order, $payment)),
            default     => null,
        };
    }
}
