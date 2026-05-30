<?php

namespace App\Http\Controllers;

use App\Actions\Checkout\PlaceOrderAction;
use App\Http\Requests\PlaceOrderRequest;
use App\Http\Resources\AddressResource;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\CartService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutController extends Controller
{
    public function __construct(private readonly CartService $cartService) {}

    public function index(Request $request): Response|RedirectResponse
    {
        $cart = $this->cartService->resolveWithItems($request);
        $activeItems = $cart->items->where('saved_for_later', false);

        if ($activeItems->isEmpty()) {
            return redirect()->route('cart.show')
                ->with('error', 'Your cart is empty. Add items before checking out.');
        }

        $user            = $request->user();
        $cartData        = $this->cartService->toArray($cart);
        $savedAddresses  = [];
        $defaultAddress  = null;

        if ($user) {
            $addresses = $user->addresses()->orderByDesc('is_default_shipping')->get();
            $savedAddresses = $addresses
                ->map(fn ($a) => (new AddressResource($a))->resolve())
                ->values()
                ->all();

            $default = $addresses->where('is_default_shipping', true)->first()
                ?? $addresses->first();

            if ($default) {
                $defaultAddress = (new AddressResource($default))->resolve();
            }
        }

        return Inertia::render('Checkout/Index', [
            'cart'            => $cartData,
            'saved_addresses' => $savedAddresses,
            'default_address' => $defaultAddress,
            'payment_methods' => $this->paymentMethods(),
        ]);
    }

    public function store(PlaceOrderRequest $request, PlaceOrderAction $action): RedirectResponse
    {
        $order = $action->execute($request);

        return redirect()
            ->route('checkout.confirmation', $order->order_number)
            ->with('success', 'Your order has been placed!');
    }

    public function confirmation(Request $request, string $orderNumber): Response|RedirectResponse
    {
        $order = Order::where('order_number', $orderNumber)
            ->with(['items.variant.images', 'items.product.primaryImage', 'coupon'])
            ->firstOrFail();

        // Auth users can only view their own orders
        if ($request->user() && $order->user_id && $order->user_id !== $request->user()->id) {
            abort(403);
        }

        return Inertia::render('Checkout/Confirmation', [
            'order' => (new OrderResource($order))->resolve(),
        ]);
    }

    private function paymentMethods(): array
    {
        return [
            ['value' => 'cod',   'label' => 'Cash on Delivery',  'description' => 'Pay when your order arrives'],
            ['value' => 'gcash', 'label' => 'GCash',             'description' => 'Pay via GCash e-wallet'],
            ['value' => 'maya',  'label' => 'Maya',              'description' => 'Pay via Maya (PayMaya)'],
            ['value' => 'card',  'label' => 'Credit / Debit Card','description' => 'Visa, Mastercard, etc.'],
        ];
    }
}
