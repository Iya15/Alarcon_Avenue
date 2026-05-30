<?php

namespace App\Services;

use App\Http\Resources\CartItemResource;
use App\Models\Cart;
use App\Models\CartItem;
use Illuminate\Http\Request;

class CartService
{
    public function __construct(private readonly CartTotalsService $totals) {}

    public function resolve(Request $request): Cart
    {
        if ($user = $request->user()) {
            return Cart::firstOrCreate(['user_id' => $user->id]);
        }

        return Cart::firstOrCreate(['session_id' => $request->session()->getId()]);
    }

    public function resolveWithItems(Request $request): Cart
    {
        return $this->loadRelations($this->resolve($request));
    }

    public function loadRelations(Cart $cart): Cart
    {
        $cart->load([
            'items.variant.product.primaryImage',
            'items.variant.product.brand',
            'items.variant.inventory',
            'items.variant.images',
            'items.variant.attributeValues.attribute',
            'coupon',
        ]);

        return $cart;
    }

    public function toArray(Cart $cart): array
    {
        $allItems = $cart->items;

        $activeItems = $allItems->where('saved_for_later', false)->values();
        $savedItems  = $allItems->where('saved_for_later', true)->values();

        $totals = $this->totals->compute($cart);

        return [
            'items'       => $activeItems->map(fn ($i) => (new CartItemResource($i))->resolve())->values()->all(),
            'saved_items' => $savedItems->map(fn ($i) => (new CartItemResource($i))->resolve())->values()->all(),
            'totals'      => $totals,
            'coupon_code' => $cart->coupon?->code,
        ];
    }

    public function getCount(Request $request): int
    {
        try {
            if ($user = $request->user()) {
                $cart = Cart::where('user_id', $user->id)->first();
            } else {
                $cart = Cart::where('session_id', $request->session()->getId())->first();
            }

            if (! $cart) {
                return 0;
            }

            return (int) $cart->items()->where('saved_for_later', false)->sum('quantity');
        } catch (\Throwable) {
            return 0;
        }
    }
}
