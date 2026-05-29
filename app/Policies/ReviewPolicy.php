<?php

namespace App\Policies;

use App\Models\Review;
use App\Models\User;

class ReviewPolicy
{
    public function viewAny(?User $user): bool
    {
        return true;
    }

    public function view(?User $user, Review $review): bool
    {
        return $review->is_approved || ($user && $user->id === $review->user_id)
            || ($user && $user->hasAnyRole(['admin', 'staff']));
    }

    public function create(User $user): bool
    {
        return $user->hasVerifiedEmail();
    }

    public function update(User $user, Review $review): bool
    {
        return $user->id === $review->user_id || $user->hasRole('admin');
    }

    public function delete(User $user, Review $review): bool
    {
        return $user->id === $review->user_id || $user->hasAnyRole(['admin', 'staff']);
    }

    public function approve(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'staff']);
    }
}
