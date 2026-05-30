<?php

namespace App\DTOs;

class PaymentSession
{
    public function __construct(
        /** Provider's session/intent ID stored as gateway_payment_intent_id */
        public readonly string $gatewayIntentId,
        /** Redirect the user to this URL. Null = no redirect (e.g. COD). */
        public readonly ?string $redirectUrl,
        /** For embedded JS flows (unused until JS SDK added). */
        public readonly ?string $clientSecret = null,
        public readonly array $metadata = [],
    ) {}
}
