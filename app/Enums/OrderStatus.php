<?php

namespace App\Enums;

enum OrderStatus: string
{
    case Pending           = 'pending';
    case AwaitingPayment   = 'awaiting_payment';
    case Paid              = 'paid';
    case Processing        = 'processing';
    case Shipped           = 'shipped';
    case Delivered         = 'delivered';
    case Cancelled         = 'cancelled';
    case Refunded          = 'refunded';
    case PartiallyRefunded = 'partially_refunded';

    public function label(): string
    {
        return match ($this) {
            self::Pending           => 'Pending',
            self::AwaitingPayment   => 'Awaiting Payment',
            self::Paid              => 'Paid',
            self::Processing        => 'Processing',
            self::Shipped           => 'Shipped',
            self::Delivered         => 'Delivered',
            self::Cancelled         => 'Cancelled',
            self::Refunded          => 'Refunded',
            self::PartiallyRefunded => 'Partially Refunded',
        };
    }

    public function isFinal(): bool
    {
        return in_array($this, [self::Delivered, self::Cancelled, self::Refunded, self::PartiallyRefunded]);
    }

    public function canCancel(): bool
    {
        return in_array($this, [self::Pending, self::AwaitingPayment, self::Paid, self::Processing]);
    }
}
