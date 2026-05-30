<?php

namespace App\Http\Controllers\Account;

use App\Actions\Account\TrackRecentlyViewedAction;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class RecentlyViewedController extends Controller
{
    public function index(Request $request): Response
    {
        $items = $request->user()
            ->recentlyViewed()
            ->with(['product.primaryImage', 'product.brand'])
            ->limit(20)
            ->get()
            ->map(fn ($rv) => [
                'product_id'   => $rv->product_id,
                'name'         => $rv->product?->name,
                'slug'         => $rv->product?->slug,
                'brand_name'   => $rv->product?->brand?->name,
                'price_cents'  => $rv->product?->base_price_cents,
                'viewed_at'    => $rv->viewed_at?->toISOString(),
                'image_url'    => $rv->product?->primaryImage?->path
                    ? Storage::disk('media')->url($rv->product->primaryImage->path)
                    : null,
            ])
            ->all();

        return Inertia::render('Account/RecentlyViewed', ['items' => $items]);
    }

    public function track(Request $request, TrackRecentlyViewedAction $action): JsonResponse
    {
        $request->validate(['product_id' => ['required', 'integer', 'exists:products,id']]);

        $action->execute($request->user(), $request->integer('product_id'));

        return response()->json(['ok' => true]);
    }

    public function mergeGuestList(Request $request, TrackRecentlyViewedAction $action): JsonResponse
    {
        $request->validate(['ids' => ['required', 'array'], 'ids.*' => ['integer']]);

        $action->mergeGuestList($request->user(), $request->input('ids'));

        return response()->json(['ok' => true]);
    }
}
