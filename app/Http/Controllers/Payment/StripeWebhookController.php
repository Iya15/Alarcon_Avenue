<?php

namespace App\Http\Controllers\Payment;

use App\Actions\Payment\HandleWebhookAction;
use App\Http\Controllers\Controller;
use App\Services\Payment\StripeGateway;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StripeWebhookController extends Controller
{
    public function __construct(
        private readonly StripeGateway     $gateway,
        private readonly HandleWebhookAction $handler,
    ) {}

    public function __invoke(Request $request): JsonResponse
    {
        // 1. Verify signature
        if (! $this->gateway->verifyWebhook($request)) {
            return response()->json(['error' => 'Invalid signature.'], 403);
        }

        // 2. Parse the event
        $event = $this->gateway->parseWebhook($request);

        // 3. Process (idempotent)
        $this->handler->execute($event);

        return response()->json(['status' => 'ok']);
    }
}
