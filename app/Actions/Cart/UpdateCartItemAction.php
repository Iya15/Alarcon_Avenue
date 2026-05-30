<?php

namespace App\Actions\Cart;

use App\Models\CartItem;
use Illuminate\Validation\ValidationException;

class UpdateCartItemAction
{
    public function execute(CartItem $item, int $quantity): CartItem
    {
        $available = $item->variant?->inventory?->available ?? 0;

        if ($available <= 0) {
            throw ValidationException::withMessages(['quantity' => 'This item is no longer in stock.']);
        }

        $newQty = min($quantity, $available, 10);
        $item->update(['quantity' => $newQty]);

        return $item->fresh();
    }
}
