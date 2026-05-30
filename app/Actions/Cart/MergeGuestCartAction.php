<?php

namespace App\Actions\Cart;

use App\Models\Cart;
use App\Models\User;

class MergeGuestCartAction
{
    public function execute(User $user, string $sessionId): Cart
    {
        $guestCart = Cart::where('session_id', $sessionId)->with(['items.variant.inventory', 'coupon'])->first();

        $userCart = Cart::firstOrCreate(['user_id' => $user->id]);

        if (! $guestCart || $guestCart->items->isEmpty()) {
            return $userCart;
        }

        $userCart->load(['items']);

        foreach ($guestCart->items as $guestItem) {
            $available = $guestItem->variant?->inventory?->available ?? 0;

            if ($available <= 0) {
                continue;
            }

            $existing = $userCart->items
                ->where('product_variant_id', $guestItem->product_variant_id)
                ->first();

            if ($existing) {
                $newQty = min($existing->quantity + $guestItem->quantity, $available, 10);
                $existing->update(['quantity' => $newQty]);
            } else {
                $qty = min($guestItem->quantity, $available, 10);
                $userCart->items()->create([
                    'product_variant_id' => $guestItem->product_variant_id,
                    'quantity'           => $qty,
                    'unit_price_cents'   => $guestItem->unit_price_cents,
                    'saved_for_later'    => $guestItem->saved_for_later,
                ]);
            }
        }

        // Inherit guest coupon only if user cart has none (re-validate first)
        if (! $userCart->coupon_id && $guestCart->coupon_id && $guestCart->coupon) {
            if ($guestCart->coupon->isValid()) {
                $userCart->update(['coupon_id' => $guestCart->coupon_id]);
            }
        }

        $guestCart->delete();

        return $userCart;
    }
}
