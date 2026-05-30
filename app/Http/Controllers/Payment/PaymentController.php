<?php

namespace App\Http\Controllers\Payment;

use App\Actions\Payment\InitiatePaymentAction;
use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    public function initiate(
        Request              $request,
        string               $orderNumber,
        InitiatePaymentAction $action,
    ): RedirectResponse {
        $order = Order::where('order_number', $orderNumber)->firstOrFail();

        // Only the order owner (or guest via order number) can pay
        if ($request->user() && $order->user_id && $order->user_id !== $request->user()->id) {
            abort(403);
        }

        // Only pending orders can be initiated
        if ($order->status !== OrderStatus::Pending) {
            return redirect()->route('checkout.confirmation', $orderNumber)
                ->with('error', 'This order is already being processed or has been paid.');
        }

        $redirectUrl = $action->execute($order);

        // COD has no redirect URL — go straight to confirmation
        if (! $redirectUrl) {
            return redirect()->route('checkout.confirmation', $orderNumber)
                ->with('success', 'Your Cash on Delivery order is confirmed!');
        }

        return redirect()->away($redirectUrl);
    }

    public function return(Request $request, string $orderNumber): Response|RedirectResponse
    {
        $order = Order::where('order_number', $orderNumber)
            ->with(['items.product.primaryImage', 'coupon'])
            ->firstOrFail();

        // The confirmation page shows the real-time status
        // If webhook already fired, order will be 'paid'; otherwise still 'awaiting_payment'
        return Inertia::render('Checkout/Confirmation', [
            'order' => (new OrderResource($order))->resolve(),
        ]);
    }
}
