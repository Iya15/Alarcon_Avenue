<?php

namespace App\Services\Payment;

use App\Contracts\PaymentGateway;
use App\DTOs\PaymentEvent;
use App\DTOs\PaymentSession;
use App\DTOs\RefundResult;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CodGateway implements PaymentGateway
{
    public function initiate(Order $order): PaymentSession
    {
        // COD requires no external redirect; the order awaits physical delivery.
        return new PaymentSession(
            gatewayIntentId: 'cod-' . $order->order_number,
            redirectUrl:     null,
        );
    }

    public function verifyWebhook(Request $request): bool
    {
        // COD has no external provider webhooks.
        return false;
    }

    public function parseWebhook(Request $request): PaymentEvent
    {
        // COD has no external provider webhooks.
        return new PaymentEvent(
            provider:       'cod',
            eventId:        Str::uuid()->toString(),
            status:         'pending',
            orderReference: '',
            transactionId:  null,
        );
    }

    public function refund(Payment $payment, int $amountCents): RefundResult
    {
        // COD refunds are manual (cash back); we just record the intent.
        return RefundResult::ok('cod-refund-' . $payment->id);
    }
}
