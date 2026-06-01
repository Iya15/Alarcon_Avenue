<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    // Groups map display tabs to actual DB status values
    private const GROUPS = [
        'all'       => [],
        'to_pay'    => ['pending', 'awaiting_payment'],
        'to_ship'   => ['paid', 'processing'],
        'to_receive' => ['shipped'],
        'completed'  => ['delivered'],
        'cancelled'  => ['cancelled'],
        'refunded'   => ['refunded', 'partially_refunded'],
    ];

    public function index(Request $request): Response
    {
        $user  = $request->user();
        $group = $request->input('group', 'all');

        if (! array_key_exists($group, self::GROUPS)) {
            $group = 'all';
        }

        $statuses = self::GROUPS[$group];

        $query = $user->orders()
            ->with(['items', 'coupon'])
            ->orderByDesc('created_at');

        if ($statuses) {
            $query->whereIn('status', $statuses);
        }

        $orders = $query->paginate(10)->withQueryString();

        // Count per group for the tab badges
        $counts = [];
        foreach (self::GROUPS as $key => $vals) {
            $q = $user->orders();
            if ($vals) {
                $q->whereIn('status', $vals);
            }
            $counts[$key] = $q->count();
        }

        return Inertia::render('Account/Orders/Index', [
            'orders'       => $orders->through(fn ($o) => (new OrderResource($o))->resolve()),
            'counts'       => $counts,
            'activeGroup'  => $group,
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
