<?php

namespace App\Http\Controllers;

use App\Actions\Reviews\SubmitReviewAction;
use App\Actions\Reviews\VoteHelpfulAction;
use App\Http\Requests\SubmitReviewRequest;
use App\Models\Product;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function store(
        SubmitReviewRequest $request,
        Product             $product,
        SubmitReviewAction  $action,
    ): RedirectResponse {
        $action->execute(
            $request->user(),
            $product,
            $request->only('rating', 'title', 'body'),
            $request->file('photos', []),
        );

        return back()->with('success', 'Your review has been submitted.');
    }

    public function vote(
        Request           $request,
        Review            $review,
        VoteHelpfulAction $action,
    ): JsonResponse {
        if ($review->status !== Review::STATUS_PUBLISHED) {
            abort(404);
        }

        $voted = $action->execute($request->user(), $review);

        return response()->json([
            'voted'         => $voted,
            'helpful_count' => $review->fresh()->helpful_count,
        ]);
    }
}
