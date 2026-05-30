<?php

namespace App\Actions\Payment;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Payment;
use App\Services\Payment\PaymentGatewayManager;

class InitiatePaymentAction
{
    public function __construct(private readonly PaymentGatewayManager $manager) {}

    /**
     * Initiate payment for an order and return the redirect URL (null for COD).
     */
    public function execute(Order $order): ?string
    {
        // Find (or create) the charge payment record for this order
        $payment = $order->payments()
            ->where('type', Payment::TYPE_CHARGE)
            ->latest()
            ->first();

        if (! $payment) {
            throw new \RuntimeException("No payment record found for order {$order->order_number}.");
        }

        $method      = $payment->method ?? 'cod';
        $gatewayName = $this->manager->gatewayNameForMethod($method);
        $gateway     = $this->manager->for($gatewayName);

        // Initiate payment with provider
        $session = $gateway->initiate($order);

        // Update the payment record with the session/intent ID and actual gateway name
        $payment->update([
            'gateway'                  => $gatewayName,
            'gateway_payment_intent_id' => $session->gatewayIntentId,
            'status'                   => Payment::STATUS_PENDING,
        ]);

        // Move order to awaiting_payment
        $order->update(['status' => OrderStatus::AwaitingPayment]);

        return $session->redirectUrl;
    }
}
