<?php

namespace App\Actions\Cart;

use App\Models\CartItem;

class RemoveCartItemAction
{
    public function execute(CartItem $item): void
    {
        $item->delete();
    }
}
