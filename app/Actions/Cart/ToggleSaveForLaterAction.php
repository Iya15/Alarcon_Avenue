<?php

namespace App\Actions\Cart;

use App\Models\CartItem;

class ToggleSaveForLaterAction
{
    public function execute(CartItem $item): CartItem
    {
        $item->update(['saved_for_later' => ! $item->saved_for_later]);
        return $item->fresh();
    }
}
