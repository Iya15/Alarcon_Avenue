<?php

namespace App\Events;

use App\Models\Cart;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Fired when a cart is flagged as abandoned by FlagAbandonedCarts.
 * Listeners can send recovery emails, push notifications, or trigger retargeting.
 */
class CartAbandoned
{
    use Dispatchable, SerializesModels;

    public function __construct(public readonly Cart $cart) {}
}
