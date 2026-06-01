<?php

namespace App\Services\Payment;

use App\Contracts\PaymentGateway;
use App\DTOs\PaymentEvent;
use App\DTOs\PaymentSession;
use App\DTOs\RefundResult;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class PayMongoGateway implements PaymentGateway
{
    private const BASE_URL = 'https://api.paymongo.com/v1';

    // PayMongo methods we handle
    private const ALLOWED_METHODS = ['gcash', 'maya'];

    private function http(): PendingRequest
    {
        $client = Http::withBasicAuth(config('services.paymongo.secret_key'), '')
            ->acceptJson()
            ->asJson();

        // cURL error 60 on Windows: CA bundle not configured in php.ini.
        // Disable SSL verification ONLY in local dev — never in production.
        if (app()->isLocal() && ! is_file(ini_get('curl.cainfo') ?: '')) {
            $client = $client->withoutVerifying();
        }

        return $client;
    }

    public function initiate(Order $order): PaymentSession
    {
        $method = $order->payments()->where('type', 'charge')->latest()->value('method') ?? 'gcash';

        // Create a PayMongo PaymentIntent
        $intent = $this->http()->post(self::BASE_URL . '/payment_intents', [
            'data' => [
                'attributes' => [
                    'amount'                => $order->total_cents,
                    'currency'              => 'PHP',
                    'payment_method_allowed' => [in_array($method, self::ALLOWED_METHODS) ? $method : 'gcash'],
                    'description'           => "Order {$order->order_number}",
                    'metadata'              => ['order_number' => $order->order_number],
                    'capture_type'          => 'automatic',
                ],
            ],
        ])->json();

        $intentId = $intent['data']['id'];

        // Create a PaymentMethod for the e-wallet
        $pm = $this->http()->post(self::BASE_URL . '/payment_methods', [
            'data' => [
                'attributes' => [
                    'type' => in_array($method, self::ALLOWED_METHODS) ? $method : 'gcash',
                ],
            ],
        ])->json();

        $pmId = $pm['data']['id'];

        // Attach the payment method → triggers checkout_url generation
        $attached = $this->http()->post(
            self::BASE_URL . "/payment_intents/{$intentId}/attach",
            [
                'data' => [
                    'attributes' => [
                        'payment_method' => $pmId,
                        'client_key'     => $intent['data']['attributes']['client_key'] ?? '',
                        'return_url'     => url("/payment/return/{$order->order_number}"),
                    ],
                ],
            ]
        )->json();

        $checkoutUrl = $attached['data']['attributes']['next_action']['redirect']['url']
            ?? $attached['data']['attributes']['checkout_url']
            ?? null;

        return new PaymentSession(
            gatewayIntentId: $intentId,
            redirectUrl:     $checkoutUrl,
        );
    }

    public function verifyWebhook(Request $request): bool
    {
        $secret = config('services.paymongo.webhook_secret');

        if (! $secret) {
            return false;
        }

        // PayMongo HMAC-SHA256 signature
        $computedSig = hash_hmac('sha256', $request->getContent(), $secret);
        $receivedSig = $request->header('Paymongo-Signature', '');

        // Signature header format: "t=<timestamp>,te=<test_sig>,li=<live_sig>"
        if (str_contains($receivedSig, 'te=')) {
            preg_match('/te=([a-f0-9]+)/', $receivedSig, $m);
            return hash_equals($computedSig, $m[1] ?? '');
        }

        if (str_contains($receivedSig, 'li=')) {
            preg_match('/li=([a-f0-9]+)/', $receivedSig, $m);
            return hash_equals($computedSig, $m[1] ?? '');
        }

        return hash_equals($computedSig, $receivedSig);
    }

    public function parseWebhook(Request $request): PaymentEvent
    {
        $payload = json_decode($request->getContent(), true);
        $data    = $payload['data'] ?? [];
        $attrs   = $data['attributes'] ?? [];
        $type    = $attrs['type'] ?? $data['type'] ?? '';

        $eventId        = $data['id'] ?? uniqid('pmev_');
        $paymentObj     = $attrs['data'] ?? [];
        $paymentAttrs   = $paymentObj['attributes'] ?? [];

        $intentId    = $paymentAttrs['payment_intent_id']
            ?? $paymentObj['id']
            ?? null;

        $orderNumber = $paymentAttrs['metadata']['order_number']
            ?? $attrs['metadata']['order_number']
            ?? '';

        $status = match ($type) {
            'payment.paid'   => 'succeeded',
            'payment.failed' => 'failed',
            default          => 'pending',
        };

        return new PaymentEvent(
            provider:       'paymongo',
            eventId:        (string) $eventId,
            status:         $status,
            orderReference: (string) $orderNumber,
            transactionId:  $intentId ? (string) $intentId : null,
            rawPayload:     $payload,
        );
    }

    public function refund(Payment $payment, int $amountCents): RefundResult
    {
        $intentId = $payment->gateway_payment_intent_id
            ?? $payment->gateway_transaction_id;

        $response = $this->http()->post(self::BASE_URL . '/refunds', [
            'data' => [
                'attributes' => [
                    'amount'     => $amountCents,
                    'payment_id' => $intentId,
                    'reason'     => 'others',
                ],
            ],
        ]);

        if ($response->successful()) {
            $refundId = $response->json('data.id');
            return RefundResult::ok($refundId);
        }

        return RefundResult::fail(
            $response->json('errors.0.detail') ?? 'PayMongo refund failed.'
        );
    }
}
