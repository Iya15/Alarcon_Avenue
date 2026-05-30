<?php

namespace App\Actions\Cart;

use App\Models\Cart;

class RemoveCouponAction
{
    public function execute(Cart $cart): void
    {
        $cart->update(['coupon_id' => null]);
    }
}
