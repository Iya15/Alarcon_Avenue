<?php

namespace App\DTOs;

class PaymentEvent
{
    public function __construct(
        /** 'stripe' | 'paymongo' | 'cod' */
        public readonly string $provider,
        /** Provider's unique event ID — used for idempotency. */
        public readonly string $eventId,
        /** 'succeeded' | 'failed' | 'pending' */
        public readonly string $status,
        /** Our order number (client_reference_id / metadata). */
        public readonly string $orderReference,
        /** Provider's transaction/intent ID that matches gateway_payment_intent_id. */
        public readonly ?string $transactionId,
        public readonly array $rawPayload = [],
    ) {}
}
