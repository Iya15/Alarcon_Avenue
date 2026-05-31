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
            'sort_order'     => $this->sort_order,
            'is_active'      => $this->is_active,
            'is_nav_featured' => $this->is_nav_featured,
            // Plain arrays — no nested JsonResource instances.
            // Nested resources cause Inertia to add a {data:{}} wrapper or crash on null.
            'parent'   => $this->whenLoaded('parent', fn () =>
                $this->parent ? [
                    'id'   => $this->parent->id,
                    'name' => $this->parent->name,
                    'slug' => $this->parent->slug,
                ] : null
            ),
            'children' => $this->whenLoaded('children', fn () =>
                ($this->children ?? collect())->map(fn ($c) => [
                    'id'        => $c->id,
                    'name'      => $c->name,
                    'slug'      => $c->slug,
                    'image_url' => $c->image_path
                        ? Storage::disk('media')->url($c->image_path)
                        : null,
                    'sort_order' => $c->sort_order,
                ])->sortBy('sort_order')->values()->all()
            ),
            'product_count' => $this->when(
                $this->relationLoaded('products'),
                fn () => $this->products->count()
            ),
        ];
    }
}
