<?php

namespace App\Contracts;

use App\DTOs\PaymentEvent;
use App\DTOs\PaymentSession;
use App\DTOs\RefundResult;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Http\Request;

interface PaymentGateway
{
    /**
     * Initiate a payment for the given order.
     * Returns a PaymentSession containing a redirect URL (or null for COD).
     */
    public function initiate(Order $order): PaymentSession;

    /**
     * Verify the webhook signature from the provider.
     * Returns false on bad/missing signature — caller should return 403.
     */
    public function verifyWebhook(Request $request): bool;

    /**
     * Parse a verified webhook request into a normalized PaymentEvent.
     */
    public function parseWebhook(Request $request): PaymentEvent;

    /**
     * Issue a (partial) refund against an existing captured payment.
     * Amount is in integer cents; currency is always PHP.
     */
    public function refund(Payment $payment, int $amountCents): RefundResult;
}
