<?php

namespace App\Actions\Cart;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\ProductVariant;
use Illuminate\Validation\ValidationException;

class AddToCartAction
{
    private const MAX_QUANTITY_PER_ITEM = 10;

    public function execute(Cart $cart, int $variantId, int $quantity): CartItem
    {
        $variant = ProductVariant::with(['product', 'inventory'])->findOrFail($variantId);

        if (! $variant->is_active || $variant->product->status !== 'active') {
            throw ValidationException::withMessages(['variant_id' => 'This product is not available.']);
        }

        $available = $variant->inventory?->available ?? 0;

        if ($available <= 0) {
            throw ValidationException::withMessages(['variant_id' => 'This item is out of stock.']);
        }

        $existing = $cart->items()->where('product_variant_id', $variantId)->first();

        if ($existing) {
            $newQty = min($existing->quantity + $quantity, $available, self::MAX_QUANTITY_PER_ITEM);
            $existing->update(['quantity' => $newQty, 'saved_for_later' => false]);
            return $existing->fresh();
        }

        $qty = min($quantity, $available, self::MAX_QUANTITY_PER_ITEM);

        return $cart->items()->create([
            'product_variant_id' => $variantId,
            'quantity'           => $qty,
            'unit_price_cents'   => $variant->effective_price,
            'saved_for_later'    => false,
        ]);
    }
}
