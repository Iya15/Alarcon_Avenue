<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderItemResource;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function index(Request $request): Response
    {
        // Eager-load relations used by OrderResource to avoid N+1 on the list page
        $orders = $request->user()
            ->orders()
            ->with(['items', 'coupon'])
            ->orderByDesc('created_at')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Account/Orders/Index', [
            'orders' => $orders->through(fn ($o) => (new OrderResource($o))->resolve()),
        ]);
    }

    public function show(Request $request, Order $order): Response
    {
        $this->authorize('view', $order);

        $order->load(['items.product.primaryImage', 'items.variant', 'payments', 'coupon']);

        return Inertia::render('Account/Orders/Show', [
            'order' => (new OrderResource($order))->resolve(),
        ]);
    }
}
