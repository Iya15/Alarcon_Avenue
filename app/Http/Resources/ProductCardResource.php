<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductCardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $variants = $this->relationLoaded('variants')
            ? $this->variants->filter(fn ($v) => $v->is_active)
            : collect();

        $inStock = $variants->contains(
            fn ($v) => $v->relationLoaded('inventory') && $v->inventory?->available > 0
        );

        $lowestPrice = $variants->min('effective_price') ?? $this->base_price_cents;

        return [
            'id'                     => $this->id,
            'name'                   => $this->name,
            'slug'                   => $this->slug,
            'base_price_cents'       => $this->base_price_cents,
            'compare_at_price_cents' => $this->compare_at_price_cents,
            'lowest_price_cents'     => $lowestPrice,
            'status'                 => $this->status,
            'is_featured'            => $this->is_featured,
            'in_stock'               => $inStock,
            'primary_image'          => $this->whenLoaded('primaryImage',
                fn () => $this->primaryImage
                    ? new ProductImageResource($this->primaryImage)
                    : null
            ),
            'categories'             => $this->when(
                $this->relationLoaded('categories'),
                fn () => $this->categories->pluck('name')
            ),
        ];
    }
}
