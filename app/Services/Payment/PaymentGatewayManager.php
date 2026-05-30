<?php

namespace App\Services\Payment;

use App\Contracts\PaymentGateway;

class PaymentGatewayManager
{
    /** Map payment method → gateway identifier */
    private const METHOD_MAP = [
        'card'   => 'stripe',
        'gcash'  => 'paymongo',
        'maya'   => 'paymongo',
        'cod'    => 'cod',
        'manual' => 'cod',  // legacy value from early checkout
    ];

    /** Lazy factory callables keyed by gateway identifier */
    private array $factories;

    public function __construct(
        ?StripeGateway    $stripeGateway    = null,
        ?PayMongoGateway  $payMongoGateway  = null,
        ?CodGateway       $codGateway       = null,
    ) {
        $this->factories = [
            'stripe'   => fn () => $stripeGateway   ?? new StripeGateway(),
            'paymongo' => fn () => $payMongoGateway ?? new PayMongoGateway(),
            'cod'      => fn () => $codGateway      ?? new CodGateway(),
        ];
    }

    /** Resolve gateway by its identifier ('stripe' | 'paymongo' | 'cod'). */
    public function for(string $gateway): PaymentGateway
    {
        if (! isset($this->factories[$gateway])) {
            throw new \InvalidArgumentException("Unknown payment gateway: \"{$gateway}\".");
        }

        return ($this->factories[$gateway])();
    }

    /** Resolve gateway from a payment method name ('card', 'gcash', 'cod', …). */
    public function forMethod(string $method): PaymentGateway
    {
        $gateway = self::METHOD_MAP[$method] ?? 'cod';

        return $this->for($gateway);
    }

    /** Which gateway identifier handles the given method string? */
    public function gatewayNameForMethod(string $method): string
    {
        return self::METHOD_MAP[$method] ?? 'cod';
    }

    /** Register a custom gateway (useful in tests). */
    public function extend(string $identifier, callable $factory): void
    {
        $this->factories[$identifier] = $factory;
    }
}
