<?php

namespace App\Actions\Reviews;

use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class SubmitReviewAction
{
    public function execute(User $user, Product $product, array $data, array $photos = []): Review
    {
        $verifiedPurchase = $this->isVerifiedBuyer($user, $product);

        $autoApprove = $verifiedPurchase && count($photos) === 0;

        $review = $product->reviews()->create([
            'user_id'           => $user->id,
            'rating'            => $data['rating'],
            'title'             => $data['title'] ?? null,
            'body'              => $data['body'] ?? null,
            'verified_purchase' => $verifiedPurchase,
            'status'            => $autoApprove ? Review::STATUS_PUBLISHED : Review::STATUS_PENDING,
            'helpful_count'     => 0,
        ]);

        foreach ($photos as $i => $photo) {
            /** @var UploadedFile $photo */
            $path = $photo->store("reviews/{$review->id}", 'media');

            $review->media()->create([
                'path'       => $path,
                'type'       => $photo->getMimeType(),
                'sort_order' => $i,
            ]);
        }

        return $review;
    }

    private function isVerifiedBuyer(User $user, Product $product): bool
    {
        return $user->orders()
            ->whereNotNull('paid_at')
            ->whereHas('items', fn ($q) => $q->where('product_id', $product->id))
            ->exists();
    }
}
