<?php

namespace App\Actions\Checkout;

use App\Enums\OrderStatus;
use App\Events\OrderPlaced;
use App\Http\Requests\PlaceOrderRequest;
use App\Models\Coupon;
use App\Models\CouponUsage;
use App\Models\Inventory;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Services\CartService;
use App\Services\CartTotalsService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PlaceOrderAction
{
    public function __construct(
        private readonly CartService $cartService,
        private readonly CartTotalsService $totalsService,
    ) {}

    public function execute(PlaceOrderRequest $request): Order
    {
        $user = $request->user();

        // ── 1. Load cart ──────────────────────────────────────────────────────
        $cart = $this->cartService->resolve($request);
        $cart->load([
            'items.variant.product',
            'items.variant.inventory',
            'items.variant.attributeValues',
            'coupon',
        ]);

        $activeItems = $cart->items->where('saved_for_later', false)->values();

        if ($activeItems->isEmpty()) {
            throw ValidationException::withMessages([
                'cart' => 'Your cart is empty.',
            ]);
        }

        // ── 2. Compute totals ─────────────────────────────────────────────────
        $totals = $this->totalsService->compute($cart);

        // ── 3. Build addresses ────────────────────────────────────────────────
        $shippingAddress = $request->shippingAddressArray();
        $billingAddress  = $request->billingAddressArray();

        // ── 4. DB transaction: stock check → create → reserve ─────────────────
        $order = DB::transaction(function () use (
            $user, $cart, $activeItems, $totals,
            $shippingAddress, $billingAddress, $request
        ) {
            // 4a. Check stock with row-level locks (prevents overselling)
            foreach ($activeItems as $item) {
                /** @var Inventory|null $inventory */
                $inventory = Inventory::where('product_variant_id', $item->product_variant_id)
                    ->lockForUpdate()
                    ->first();

                $available = $inventory?->available ?? 0;

                if ($available < $item->quantity) {
                    $name = $item->variant?->product?->name ?? 'Item';
                    throw ValidationException::withMessages([
                        'cart' => "Sorry, \"{$name}\" only has {$available} unit(s) available. Please update your cart.",
                    ]);
                }
            }

            // 4b. Create the order
            $order = Order::create([
                'user_id'          => $user?->id,
                'guest_email'      => $user ? null : $request->input('email'),
                'order_number'     => Order::generateOrderNumber(),
                'status'           => OrderStatus::Pending,
                'shipping_address' => $shippingAddress,
                'billing_address'  => $billingAddress,
                'coupon_id'        => $cart->coupon_id,
                'subtotal_cents'   => $totals['subtotal_cents'],
                'discount_cents'   => $totals['discount_cents'],
                'shipping_cents'   => $totals['shipping_cents'],
                'tax_cents'        => $totals['tax_cents'],
                'total_cents'      => $totals['total_cents'],
                'currency'         => 'PHP',
                'customer_notes'   => $request->input('notes'),
            ]);

            // 4c. Create order items + reserve stock
            foreach ($activeItems as $item) {
                $variant = $item->variant;
                $product = $variant?->product;

                $variantLabel = $variant?->attributeValues
                    ->sortBy(fn ($av) => $av->attribute?->sort_order ?? 0)
                    ->map(fn ($av) => $av->display_value)
                    ->filter()
                    ->implode(' / ') ?: null;

                OrderItem::create([
                    'order_id'           => $order->id,
                    'product_id'         => $product?->id,
                    'product_variant_id' => $item->product_variant_id,
                    'product_name'       => $product?->name ?? 'Unknown Product',
                    'variant_label'      => $variantLabel,
                    'sku'                => $variant?->sku ?? 'N/A',
                    'unit_price_cents'   => $item->unit_price_cents,
                    'quantity'           => $item->quantity,
                    'subtotal_cents'     => $item->unit_price_cents * $item->quantity,
                ]);

                // Reserve stock: increment reserved_quantity atomically
                Inventory::where('product_variant_id', $item->product_variant_id)
                    ->increment('reserved_quantity', $item->quantity);
            }

            // 4d. Create a pending Payment stub
            Payment::create([
                'order_id'     => $order->id,
                'gateway'      => 'manual',
                'amount_cents' => $order->total_cents,
                'currency'     => 'PHP',
                'status'       => 'pending',
                'method'       => $request->input('payment_method'),
            ]);

            // 4e. Record coupon usage + increment global used_count
            if ($cart->coupon_id && $user) {
                CouponUsage::create([
                    'coupon_id'  => $cart->coupon_id,
                    'user_id'    => $user->id,
                    'order_id'   => $order->id,
                    'created_at' => now(),
                ]);
                Coupon::where('id', $cart->coupon_id)->increment('used_count');
            }

            // 4f. Clear active cart items; preserve saved-for-later; mark recovered
            $cart->items()->where('saved_for_later', false)->delete();
            $cart->update([
                'coupon_id'    => null,
                'status'       => 'recovered',
                'recovered_at' => now(),
            ]);

            return $order;
        });

        // ── 5. Fire event outside transaction (runs only on commit) ───────────
        event(new OrderPlaced($order));

        return $order;
    }
}
