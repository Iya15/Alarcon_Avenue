<?php

namespace App\Http\Controllers\Admin;

use App\Enums\OrderStatus;
use App\Events\OrderStatusUpdated;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateOrderStatusRequest;
use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function index(Request $request): Response
    {
        $orders = Order::with(['user', 'coupon'])
            ->withCount('items')
            ->when($request->input('search'), fn ($q, $s) =>
                $q->where('order_number', 'ilike', "%{$s}%")
                  ->orWhereHas('user', fn ($u) => $u->where('email', 'ilike', "%{$s}%"))
            )
            ->when($request->input('status'), fn ($q, $s) => $q->where('status', $s))
            ->orderByDesc('created_at')
            ->paginate(25)
            ->withQueryString()
            ->through(fn ($o) => $this->formatOrder($o));

        return Inertia::render('Admin/Orders/Index', [
            'orders'  => $orders,
            'filters' => $request->only('search', 'status'),
            'statuses' => collect(OrderStatus::cases())->map(fn ($s) => ['value' => $s->value, 'label' => $s->label()]),
        ]);
    }

    public function show(Order $order): Response
    {
        $order->load(['user', 'items.product', 'payments', 'refunds.items', 'coupon']);

        return Inertia::render('Admin/Orders/Show', [
            'order' => [
                ...$this->formatOrder($order),
                'items' => $order->items->map(fn ($i) => [
                    'id'            => $i->id,
                    'product_name'  => $i->product_name,
                    'variant_label' => $i->variant_label,
                    'sku'           => $i->sku,
                    'unit_price_cents' => $i->unit_price_cents,
                    'quantity'      => $i->quantity,
                    'subtotal_cents' => $i->subtotal_cents,
                ]),
                'payments' => $order->payments->map(fn ($p) => [
                    'id'         => $p->id,
                    'type'       => $p->type,
                    'status'     => $p->status,
                    'amount_cents' => $p->amount_cents,
                    'created_at' => $p->created_at?->toISOString(),
                ]),
                'refunds' => $order->refunds->map(fn ($r) => [
                    'id'           => $r->id,
                    'amount_cents' => $r->amount_cents,
                    'reason'       => $r->reason,
                    'status'       => $r->status,
                    'created_at'   => $r->created_at?->toISOString(),
                ]),
            ],
        ]);
    }

    public function updateStatus(UpdateOrderStatusRequest $request, Order $order): RedirectResponse
    {
        $newStatus = OrderStatus::from($request->input('status'));

        if ($order->status->isFinal()) {
            return back()->withErrors(['status' => 'Order is in a final state and cannot be transitioned.']);
        }

        $oldStatus = $order->status;
        $order->update(['status' => $newStatus]);

        OrderStatusUpdated::dispatch($order, $oldStatus, $newStatus);

        return back()->with('success', "Order status updated to {$newStatus->label()}.");
    }

    private function formatOrder(Order $order): array
    {
        return [
            'id'             => $order->id,
            'order_number'   => $order->order_number,
            'status'         => $order->status->value,
            'status_label'   => $order->status->label(),
            'total_cents'    => $order->total_cents,
            'subtotal_cents' => $order->subtotal_cents,
            'discount_cents' => $order->discount_cents,
            'shipping_cents' => $order->shipping_cents,
            'tax_cents'      => $order->tax_cents,
            'currency'       => $order->currency,
            'items_count'    => $order->items_count ?? $order->items->count(),
            'paid_at'        => $order->paid_at?->toISOString(),
            'created_at'     => $order->created_at?->toISOString(),
            'user'           => $order->user
                ? ['id' => $order->user->id, 'name' => $order->user->name, 'email' => $order->user->email]
                : ['id' => null, 'name' => 'Guest', 'email' => $order->guest_email],
            'coupon_code'    => $order->coupon?->code,
        ];
    }
}
