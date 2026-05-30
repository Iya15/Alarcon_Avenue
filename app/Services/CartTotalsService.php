<?php

namespace App\Services;

use App\Models\Cart;

class CartTotalsService
{
    // Free shipping threshold: ₱1,500 = 150,000 cents
    private const FREE_SHIPPING_THRESHOLD_CENTS = 150_000;

    // Flat shipping fee: ₱150 = 15,000 cents
    private const SHIPPING_RATE_CENTS = 15_000;

    public function compute(Cart $cart): array
    {
        $activeItems = $cart->items->where('saved_for_later', false)->values();

        $subtotalCents = $activeItems->sum(fn ($item) => $item->unit_price_cents * $item->quantity);

        [$discountCents, $freeShipping, $couponData] = $this->applyCoupon($cart, $subtotalCents);

        $subtotalAfterDiscount = $subtotalCents - $discountCents;

        // Flat ₱150 shipping; free over ₱1,500 threshold, via coupon, or on ₱0 orders
        $shippingCents = ($freeShipping
            || $subtotalAfterDiscount >= self::FREE_SHIPPING_THRESHOLD_CENTS
            || $subtotalAfterDiscount <= 0)
            ? 0
            : self::SHIPPING_RATE_CENTS;

        // VAT-inclusive extraction: prices already include 12% VAT
        // VAT component = amount × 12/112
        $taxCents = (int) round($subtotalAfterDiscount * 12 / 112);

        // Total = subtotal_after_discount + shipping (tax already inside subtotal)
        $totalCents = $subtotalAfterDiscount + $shippingCents;

        $remaining = max(0, self::FREE_SHIPPING_THRESHOLD_CENTS - $subtotalAfterDiscount);

        return [
            'subtotal_cents'                  => $subtotalCents,
            'discount_cents'                  => $discountCents,
            'shipping_cents'                  => $shippingCents,
            'tax_cents'                       => $taxCents,
            'total_cents'                     => $totalCents,
            'coupon'                          => $couponData,
            'items_count'                     => $activeItems->sum('quantity'),
            'free_shipping_threshold_cents'   => self::FREE_SHIPPING_THRESHOLD_CENTS,
            'free_shipping_remaining_cents'   => $remaining,
            'free_shipping_applied'           => $shippingCents === 0 && $subtotalCents > 0,
        ];
    }

    private function applyCoupon(Cart $cart, int $subtotalCents): array
    {
        $discountCents = 0;
        $freeShipping  = false;
        $couponData    = null;

        if (! $cart->coupon_id || ! $cart->relationLoaded('coupon')) {
            return [$discountCents, $freeShipping, $couponData];
        }

        $coupon = $cart->coupon;

        if (! $coupon || ! $coupon->isValid()) {
            return [$discountCents, $freeShipping, $couponData];
        }

        // Min order check
        if ($coupon->min_order_cents && $subtotalCents < $coupon->min_order_cents) {
            return [$discountCents, $freeShipping, $couponData];
        }

        match ($coupon->discount_type) {
            'percentage'   => $discountCents = (int) round($subtotalCents * $coupon->discount_value / 100),
            'fixed_cents'  => $discountCents = min($coupon->discount_value, $subtotalCents),
            'free_shipping' => $freeShipping = true,
            default         => null,
        };

        $couponData = [
            'code'  => $coupon->code,
            'type'  => $coupon->discount_type,
            'value' => $coupon->discount_value,
        ];

        return [$discountCents, $freeShipping, $couponData];
    }
}
