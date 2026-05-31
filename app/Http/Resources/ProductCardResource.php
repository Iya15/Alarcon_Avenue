<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

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
            // Build as a plain array (same approach as RecentlyViewedController) so Inertia
            // never wraps it in a { data: {...} } envelope, which would break primary_image.url.
            'primary_image' => $this->whenLoaded('primaryImage', fn () =>
                $this->primaryImage ? [
                    'url'      => Storage::disk('media')->url($this->primaryImage->path),
                    'alt_text' => $this->primaryImage->alt_text,
                ] : null
            ),
            'categories'             => $this->when(
                $this->relationLoaded('categories'),
                fn () => $this->categories->pluck('name')
            ),
        ];
    }
}
