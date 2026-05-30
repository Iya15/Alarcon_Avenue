<?php

namespace App\Actions\Account;

use App\Models\RecentlyViewed;
use App\Models\User;

class TrackRecentlyViewedAction
{
    private const CAP = 20;

    public function execute(User $user, int $productId): void
    {
        // Upsert: update viewed_at if already exists, insert otherwise
        RecentlyViewed::updateOrInsert(
            ['user_id' => $user->id, 'product_id' => $productId],
            ['viewed_at' => now()],
        );

        // Prune to CAP — keep the 20 most-recent, delete anything older
        $keep = RecentlyViewed::where('user_id', $user->id)
            ->orderByDesc('viewed_at')
            ->limit(self::CAP)
            ->pluck('id');

        RecentlyViewed::where('user_id', $user->id)
            ->whereNotIn('id', $keep)
            ->delete();
    }

    public function mergeGuestList(User $user, array $productIds): void
    {
        // Merge guest cookie list into the DB table (oldest first so newest wins on cap)
        foreach (array_reverse($productIds) as $productId) {
            $this->execute($user, (int) $productId);
        }
    }
}
