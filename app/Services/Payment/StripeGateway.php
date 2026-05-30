<?php

namespace App\Services\Payment;

use App\Contracts\PaymentGateway;
use App\DTOs\PaymentEvent;
use App\DTOs\PaymentSession;
use App\DTOs\RefundResult;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Http\Request;
use Stripe\Exception\SignatureVerificationException;
use Stripe\Refund as StripeRefund;
use Stripe\StripeClient;
use Stripe\Webhook;

class StripeGateway implements PaymentGateway
{
    private ?StripeClient $client = null;
    private ?StripeClient $injectedClient;

    public function __construct(?StripeClient $client = null)
    {
        $this->injectedClient = $client;
    }

    /** Lazily initialize the Stripe client so parseWebhook() doesn't need a key. */
    private function client(): StripeClient
    {
        if (! $this->client) {
            $this->client = $this->injectedClient
                ?? new StripeClient(config('services.stripe.secret') ?: throw new \RuntimeException('STRIPE_SECRET is not configured.'));
        }

        return $this->client;
    }

    public function initiate(Order $order): PaymentSession
    {
        $session = $this->client()->checkout->sessions->create([
            'payment_method_types' => ['card'],
            'mode'                 => 'payment',
            'client_reference_id'  => $order->order_number,
            'line_items'           => [[
                'price_data' => [
                    'currency'     => 'php',
                    'unit_amount'  => $order->total_cents, // already smallest unit
                    'product_data' => [
                        'name' => "Order {$order->order_number} — Alarcon Avenue",
                    ],
                ],
                'quantity' => 1,
            ]],
            'success_url' => url("/payment/return/{$order->order_number}?session_id={CHECKOUT_SESSION_ID}"),
            'cancel_url'  => url("/checkout/confirmation/{$order->order_number}"),
            'metadata'    => ['order_number' => $order->order_number],
        ]);

        return new PaymentSession(
            gatewayIntentId: $session->id,
            redirectUrl:     $session->url,
        );
    }

    public function verifyWebhook(Request $request): bool
    {
        $secret = config('services.stripe.webhook_secret');

        if (! $secret) {
            return false;
        }

        try {
            Webhook::constructEvent(
                $request->getContent(),
                $request->header('Stripe-Signature', ''),
                $secret,
            );
            return true;
        } catch (SignatureVerificationException) {
            return false;
        }
    }

    public function parseWebhook(Request $request): PaymentEvent
    {
        $event = \Stripe\Event::constructFrom(
            json_decode($request->getContent(), true)
        );

        $session        = $event->data->object;
        $orderReference = $session->client_reference_id
            ?? $session->metadata['order_number']
            ?? '';

        $transactionId = $session->id
            ?? $session->payment_intent
            ?? null;

        $status = match ($event->type) {
            'checkout.session.completed'      => 'succeeded',
            'checkout.session.expired'        => 'failed',
            'payment_intent.payment_failed'   => 'failed',
            'payment_intent.succeeded'        => 'succeeded',
            default                           => 'pending',
        };

        return new PaymentEvent(
            provider:       'stripe',
            eventId:        $event->id,
            status:         $status,
            orderReference: $orderReference,
            transactionId:  (string) $transactionId,
            rawPayload:     json_decode($request->getContent(), true),
        );
    }

    public function refund(Payment $payment, int $amountCents): RefundResult
    {
        try {
            // For Checkout Sessions, refund via the payment_intent
            $intentId = $payment->gateway_transaction_id
                ?? $payment->gateway_payment_intent_id;

            $refund = $this->client()->refunds->create([
                'payment_intent' => $intentId,
                'amount'         => $amountCents,
            ]);

            return RefundResult::ok($refund->id);
        } catch (\Stripe\Exception\ApiErrorException $e) {
            return RefundResult::fail($e->getMessage());
        }
    }
}
