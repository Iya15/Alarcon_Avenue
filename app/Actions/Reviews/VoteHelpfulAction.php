<?php

namespace App\Actions\Reviews;

use App\Models\Review;
use App\Models\ReviewVote;
use App\Models\User;

class VoteHelpfulAction
{
    /**
     * Returns true if the vote was cast, false if already voted.
     */
    public function execute(User $user, Review $review): bool
    {
        $alreadyVoted = ReviewVote::where('review_id', $review->id)
            ->where('user_id', $user->id)
            ->exists();

        if ($alreadyVoted) {
            return false;
        }

        ReviewVote::create([
            'review_id'  => $review->id,
            'user_id'    => $user->id,
            'created_at' => now(),
        ]);

        $review->increment('helpful_count');

        return true;
    }
}
