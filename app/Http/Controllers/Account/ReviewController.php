<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Http\Requests\Account\UpdateReviewRequest;
use App\Models\Review;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ReviewController extends Controller
{
    public function index(Request $request): Response
    {
        $reviews = $request->user()
            ->reviews()
            ->with(['product.primaryImage'])
            ->orderByDesc('created_at')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Account/Reviews', [
            'reviews' => $reviews->through(fn ($r) => [
                'id'           => $r->id,
                'rating'       => $r->rating,
                'title'        => $r->title,
                'body'         => $r->body,
                'status'       => $r->status,
                'created_at'   => $r->created_at?->toISOString(),
                'product_name' => $r->product?->name,
                'product_slug' => $r->product?->slug,
                'image_url'    => $r->product?->primaryImage?->path
                    ? Storage::disk('media')->url($r->product->primaryImage->path)
                    : null,
            ]),
        ]);
    }

    public function update(UpdateReviewRequest $request, Review $review): RedirectResponse
    {
        $review->update($request->validated());

        return back()->with('success', 'Review updated.');
    }

    public function destroy(Request $request, Review $review): RedirectResponse
    {
        if ($review->user_id !== $request->user()->id) {
            abort(403);
        }

        $review->delete();

        return back()->with('success', 'Review deleted.');
    }
}
