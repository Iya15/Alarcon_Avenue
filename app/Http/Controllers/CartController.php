<?php

namespace App\Http\Controllers;

use App\Actions\Cart\AddToCartAction;
use App\Actions\Cart\ApplyCouponAction;
use App\Actions\Cart\MergeGuestCartAction;
use App\Actions\Cart\RemoveCartItemAction;
use App\Actions\Cart\RemoveCouponAction;
use App\Actions\Cart\ToggleSaveForLaterAction;
use App\Actions\Cart\UpdateCartItemAction;
use App\Http\Requests\AddToCartRequest;
use App\Http\Requests\ApplyCouponRequest;
use App\Http\Requests\UpdateCartItemRequest;
use App\Models\CartItem;
use App\Services\CartService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CartController extends Controller
{
    public function __construct(private readonly CartService $cartService) {}

    // ── Inertia page ──────────────────────────────────────────────────────────

    public function show(Request $request): Response
    {
        $cart = $this->cartService->resolveWithItems($request);

        return Inertia::render('Cart/Index', $this->cartService->toArray($cart));
    }

    // ── JSON API ──────────────────────────────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $cart = $this->cartService->resolveWithItems($request);
        return response()->json($this->cartService->toArray($cart));
    }

    public function store(AddToCartRequest $request, AddToCartAction $action): JsonResponse
    {
        $cart = $this->cartService->resolve($request);
        $action->execute($cart, $request->integer('variant_id'), $request->integer('quantity'));
        $cart = $this->cartService->resolveWithItems($request);
        return response()->json($this->cartService->toArray($cart));
    }

    public function update(UpdateCartItemRequest $request, CartItem $cartItem, UpdateCartItemAction $action): JsonResponse
    {
        $this->authorizeItem($cartItem, $request);
        $cartItem->loadMissing('variant.inventory');
        $action->execute($cartItem, $request->integer('quantity'));
        $cart = $this->cartService->resolveWithItems($request);
        return response()->json($this->cartService->toArray($cart));
    }

    public function destroy(Request $request, CartItem $cartItem, RemoveCartItemAction $action): JsonResponse
    {
        $this->authorizeItem($cartItem, $request);
        $action->execute($cartItem);
        $cart = $this->cartService->resolveWithItems($request);
        return response()->json($this->cartService->toArray($cart));
    }

    public function saveForLater(Request $request, CartItem $cartItem, ToggleSaveForLaterAction $action): JsonResponse
    {
        $this->authorizeItem($cartItem, $request);
        $action->execute($cartItem);
        $cart = $this->cartService->resolveWithItems($request);
        return response()->json($this->cartService->toArray($cart));
    }

    public function applyCoupon(ApplyCouponRequest $request, ApplyCouponAction $action): JsonResponse
    {
        $cart = $this->cartService->resolve($request);
        $action->execute($cart, $request->input('code'), $request->user());
        $cart = $this->cartService->resolveWithItems($request);
        return response()->json($this->cartService->toArray($cart));
    }

    public function removeCoupon(Request $request, RemoveCouponAction $action): JsonResponse
    {
        $cart = $this->cartService->resolve($request);
        $action->execute($cart);
        $cart = $this->cartService->resolveWithItems($request);
        return response()->json($this->cartService->toArray($cart));
    }

    public function merge(Request $request, MergeGuestCartAction $action): JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['error' => 'Unauthenticated.'], 401);
        }

        $sessionId = $request->input('session_id') ?? $request->session()->getId();
        $action->execute($user, $sessionId);
        $cart = $this->cartService->resolveWithItems($request);
        return response()->json($this->cartService->toArray($cart));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function authorizeItem(CartItem $item, Request $request): void
    {
        $currentCart = $this->cartService->resolve($request);
        if ($item->cart_id !== $currentCart->id) {
            abort(403, 'This item does not belong to your cart.');
        }
    }
}
