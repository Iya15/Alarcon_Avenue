<?php

namespace App\Observers;

use App\Models\Review;

class ReviewObserver
{
    /**
     * Recompute product rating after a review is saved.
     * Only triggers when the status column actually changes (prevents redundant recalculations).
     */
    public function saved(Review $review): void
    {
        if ($review->wasChanged('status')) {
            $review->product->recalculateRating();
        }
    }

    /**
     * Recompute when a review is permanently deleted.
     */
    public function deleted(Review $review): void
    {
        $review->product->recalculateRating();
    }
}
