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
            'categories'             => CategoryResource::collection($this->whenLoaded('categories')),
            'images'                 => ProductImageResource::collection($this->whenLoaded('images')),
            'variants'               => ProductVariantResource::collection($this->whenLoaded('variants')),
            'primary_image'          => new ProductImageResource($this->whenLoaded('primaryImage')),
        ];
    }
}
