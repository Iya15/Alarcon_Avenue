<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $approvedReviews = $this->whenLoaded('approvedReviews');

        return [
            'id'                     => $this->id,
            'name'                   => $this->name,
            'slug'                   => $this->slug,
            'description'            => $this->description,
            'short_description'      => $this->short_description,
            'base_price_cents'       => $this->base_price_cents,
            'compare_at_price_cents' => $this->compare_at_price_cents,
            'status'                 => $this->status,
            'is_featured'            => $this->is_featured,
            'meta_title'             => $this->meta_title,
            'meta_description'       => $this->meta_description,
            'categories'             => CategoryResource::collection($this->whenLoaded('categories')),
            'images'                 => ProductImageResource::collection($this->whenLoaded('images')),
            'variants'               => ProductVariantResource::collection($this->whenLoaded('variants')),
            'review_count'           => $this->when(
                $approvedReviews !== null,
                fn () => $approvedReviews->count()
            ),
            'average_rating'         => $this->when(
                $approvedReviews !== null && $approvedReviews->isNotEmpty(),
                fn () => round($approvedReviews->avg('rating'), 1)
            ),
        ];
    }
}
