<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Reviews\ModerateReviewAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\ModerateReviewRequest;
use App\Models\Review;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ReviewModerationController extends Controller
{
    public function index(): Response
    {
        $reviews = Review::with(['user', 'product', 'media'])
            ->where('status', Review::STATUS_PENDING)
            ->latest()
            ->paginate(20)
            ->withQueryString()
            ->through(fn ($r) => $this->formatReview($r));

        return Inertia::render('Admin/Reviews/Index', ['reviews' => $reviews]);
    }

    public function update(
        ModerateReviewRequest $request,
        Review                $review,
        ModerateReviewAction  $action,
    ): RedirectResponse {
        match ($request->input('action')) {
            'approve' => $action->approve($review),
            'reject'  => $action->reject($review, $request->input('reason', '')),
        };

        return back()->with('success', 'Review moderated.');
    }

    private function formatReview(Review $r): array
    {
        return [
            'id'               => $r->id,
            'rating'           => $r->rating,
            'title'            => $r->title,
            'body'             => $r->body,
            'status'           => $r->status,
            'verified_purchase' => $r->verified_purchase,
            'helpful_count'    => $r->helpful_count,
            'rejection_reason' => $r->rejection_reason,
            'created_at'       => $r->created_at?->toISOString(),
            'user'             => ['id' => $r->user?->id, 'name' => $r->user?->name],
            'product'          => ['id' => $r->product?->id, 'name' => $r->product?->name, 'slug' => $r->product?->slug],
            'media_count'      => $r->media->count(),
        ];
    }
}
