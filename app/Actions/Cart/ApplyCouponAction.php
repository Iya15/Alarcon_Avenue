<?php

namespace App\Actions\Cart;

use App\Models\Cart;
use App\Models\Coupon;
use App\Models\CouponUsage;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class ApplyCouponAction
{
    public function execute(Cart $cart, string $code, ?User $user): Coupon
    {
        $coupon = Coupon::whereRaw('UPPER(code) = UPPER(?)', [trim($code)])->first();

        if (! $coupon) {
            throw ValidationException::withMessages(['code' => 'Invalid coupon code.']);
        }

        if (! $coupon->isValid()) {
            throw ValidationException::withMessages(['code' => 'This coupon has expired or is no longer available.']);
        }

        // Min order check against active items subtotal
        if ($coupon->min_order_cents) {
            $subtotal = $cart->items()
                ->where('saved_for_later', false)
                ->selectRaw('SUM(unit_price_cents * quantity) as total')
                ->value('total') ?? 0;

            if ($subtotal < $coupon->min_order_cents) {
                $minFormatted = '₱' . number_format($coupon->min_order_cents / 100, 2);
                throw ValidationException::withMessages([
                    'code' => "This coupon requires a minimum order of {$minFormatted}.",
                ]);
            }
        }

        // Per-user limit check (only for authenticated users)
        if ($user && $coupon->max_uses_per_user !== null) {
            $used = CouponUsage::where('coupon_id', $coupon->id)
                ->where('user_id', $user->id)
                ->count();

            if ($used >= $coupon->max_uses_per_user) {
                throw ValidationException::withMessages([
                    'code' => "You've already used this coupon the maximum number of times.",
                ]);
            }
        }

        $cart->update(['coupon_id' => $coupon->id]);

        return $coupon;
    }
}
