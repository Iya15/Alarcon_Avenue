<?php

namespace App\Actions\Reviews;

use App\Models\Review;

class ModerateReviewAction
{
    public function approve(Review $review): void
    {
        $review->update([
            'status'           => Review::STATUS_PUBLISHED,
            'rejection_reason' => null,
        ]);
    }

    public function reject(Review $review, string $reason): void
    {
        $review->update([
            'status'           => Review::STATUS_REJECTED,
            'rejection_reason' => $reason,
        ]);
    }
}
