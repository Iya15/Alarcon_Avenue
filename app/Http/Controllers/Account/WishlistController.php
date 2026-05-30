<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Models\Wishlist;
use App\Models\WishlistItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class WishlistController extends Controller
{
    public function index(Request $request): Response
    {
        $wishlists = $request->user()
            ->wishlists()
            ->with([
                'items.product.primaryImage',
                'items.product.brand',
                'items.variant.inventory',
            ])
            ->get();

        $items = $wishlists->flatMap(fn ($w) => $w->items->map(fn ($i) => [
            'id'            => $i->id,
            'wishlist_id'   => $i->wishlist_id,
            'product_id'    => $i->product_id,
            'variant_id'    => $i->product_variant_id,
            'product_name'  => $i->product?->name,
            'product_slug'  => $i->product?->slug,
            'brand_name'    => $i->product?->brand?->name,
            'price_cents'   => $i->product?->base_price_cents,
            'in_stock'      => ($i->variant?->inventory?->available ?? 1) > 0,
            'image_url'     => $i->product?->primaryImage?->path
                ? Storage::disk('media')->url($i->product->primaryImage->path)
                : null,
        ]))->values()->all();

        return Inertia::render('Account/Wishlist', [
            'items'      => $items,
            'wishlistId' => $wishlists->first()?->id,
        ]);
    }

    public function destroy(Request $request, WishlistItem $wishlistItem): RedirectResponse
    {
        if ($wishlistItem->wishlist->user_id !== $request->user()->id) {
            abort(403);
        }

        $wishlistItem->delete();

        return back()->with('success', 'Removed from wishlist.');
    }
}
