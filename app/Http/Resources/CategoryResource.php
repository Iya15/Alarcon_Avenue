<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class CategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'parent_id'   => $this->parent_id,
            'name'        => $this->name,
            'slug'        => $this->slug,
            'description' => $this->description,
            'image_url'   => $this->image_path
                ? Storage::disk('media')->url($this->image_path)
                : null,
            'sort_order'  => $this->sort_order,
            'is_active'   => $this->is_active,
            'parent'      => new CategoryResource($this->whenLoaded('parent')),
            'children'    => CategoryResource::collection($this->whenLoaded('children')),
            'product_count' => $this->when(
                $this->relationLoaded('products'),
                fn () => $this->products->count()
            ),
        ];
    }
}
