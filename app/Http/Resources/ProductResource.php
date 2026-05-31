<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                     => $this->id,
            'vendor_id'              => $this->vendor_id,
            'name'                   => $this->name,
            'slug'                   => $this->slug,
            'description'            => $this->description,
            'short_description'      => $this->short_description,
            'base_price_cents'       => $this->base_price_cents,
            'compare_at_price_cents' => $this->compare_at_price_cents,
            'cost_price_cents'       => $this->cost_price_cents,
            'status'                 => $this->status,
            'is_featured'            => $this->is_featured,
            'meta_title'             => $this->meta_title,
            'meta_description'       => $this->meta_description,
            'created_at'             => $this->created_at?->toISOString(),
            'updated_at'             => $this->updated_at?->toISOString(),
            'deleted_at'             => $this->deleted_at?->toISOString(),
            'categories' => $this->whenLoaded('categories', fn () =>
                $this->categories->map(fn ($c) => (new CategoryResource($c))->resolve())->values()->all()
            ),
            'images' => $this->whenLoaded('images', fn () =>
                $this->images->map(fn ($i) => (new ProductImageResource($i))->resolve())->values()->all()
            ),
            'variants' => $this->whenLoaded('variants', fn () =>
                $this->variants->map(fn ($v) => (new ProductVariantResource($v))->resolve())->values()->all()
            ),
            'primary_image' => $this->whenLoaded('primaryImage', fn () =>
                $this->primaryImage ? (new ProductImageResource($this->primaryImage))->resolve() : null
            ),
        ];
    }
}
