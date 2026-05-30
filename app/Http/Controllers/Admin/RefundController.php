<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Payment\ProcessRefundAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\ProcessRefundRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class RefundController extends Controller
{
    public function store(
        ProcessRefundRequest $request,
        Order                $order,
        ProcessRefundAction  $action,
    ): JsonResponse|RedirectResponse {
        $payment = $order->payments()
            ->where('type', 'charge')
            ->where('status', 'captured')
            ->latest()
            ->first();

        if (! $payment) {
            return back()->withErrors(['refund' => 'No captured payment found for this order.']);
        }

        $maxRefundable = $order->total_cents - $order->refunds()->sum('total_cents');

        if ($request->integer('amount_cents') > $maxRefundable) {
            return back()->withErrors(['amount_cents' => "Maximum refundable amount is ₱" . number_format($maxRefundable / 100, 2)]);
        }

        $action->execute(
            order:       $order,
            payment:     $payment,
            amountCents: $request->integer('amount_cents'),
            reason:      $request->input('reason'),
            admin:       $request->user(),
        );

        if ($request->wantsJson()) {
            $order->load(['payments', 'refunds', 'items.product.primaryImage']);
            return response()->json(['order' => (new OrderResource($order))->resolve()]);
        }

        return back()->with('success', 'Refund processed successfully.');
    }

    public function transactions(Order $order): Response
    {
        $this->authorize('view', $order);

        $order->load(['payments', 'refunds.processedBy', 'items']);

        return Inertia::render('Admin/Orders/Transactions', [
            'order'    => (new OrderResource($order))->resolve(),
            'payments' => $order->payments->map(fn ($p) => [
                'id'           => $p->id,
                'type'         => $p->type,
                'gateway'      => $p->gateway,
                'method'       => $p->method,
                'amount_cents' => $p->amount_cents,
                'status'       => $p->status,
                'captured_at'  => $p->captured_at?->toISOString(),
                'refunded_at'  => $p->refunded_at?->toISOString(),
                'failed_at'    => $p->failed_at?->toISOString(),
            ])->values()->all(),
        ]);
    }
}
