<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                     => $this->id,
            'name'                   => $this->name,
            'slug'                   => $this->slug,
            // Strip anything outside a safe formatting allowlist before sending to the frontend.
            // dangerouslySetInnerHTML in Show.tsx renders this, so dangerous tags must be removed here.
            'description'            => $this->description
                ? strip_tags($this->description, '<p><br><strong><em><b><i><ul><ol><li><h2><h3><h4><blockquote><hr>')
                : null,
            'short_description'      => $this->short_description,
            'base_price_cents'       => $this->base_price_cents,
            'compare_at_price_cents' => $this->compare_at_price_cents,
            'status'                 => $this->status,
            'is_featured'            => $this->is_featured,
            'meta_title'             => $this->meta_title,
            'meta_description'       => $this->meta_description,

            // Use manual mapping (not ResourceCollection) to avoid a nested `data` wrapper
            // when the resource is serialized through Inertia's prop pipeline.
            'categories' => $this->whenLoaded('categories', fn () =>
                $this->categories->map(fn ($c) => (new CategoryResource($c))->resolve())->values()->all()
            ),
            'images' => $this->whenLoaded('images', fn () =>
                $this->images->map(fn ($i) => (new ProductImageResource($i))->resolve())->values()->all()
            ),
            'variants' => $this->whenLoaded('variants', fn () =>
                $this->variants->map(fn ($v) => (new ProductVariantResource($v))->resolve())->values()->all()
            ),

            'rating_average' => $this->rating_average,
            'review_count'   => $this->review_count,

            'reviews' => $this->whenLoaded('publishedReviews', fn () =>
                $this->publishedReviews->map(fn ($r) => [
                    'id'               => $r->id,
                    'rating'           => $r->rating,
                    'title'            => $r->title,
                    'body'             => $r->body,
                    'verified_purchase' => $r->verified_purchase,
                    'helpful_count'    => $r->helpful_count,
                    'created_at'       => $r->created_at?->toISOString(),
                    'user'             => ['id' => $r->user?->id, 'name' => $r->user?->name],
                    'media'            => $r->media->map(fn ($m) => [
                        'id'         => $m->id,
                        'url'        => \Illuminate\Support\Facades\Storage::disk('media')->url($m->path),
                        'type'       => $m->type,
                        'sort_order' => $m->sort_order,
                    ])->values()->all(),
                ])->values()->all()
            ),
        ];
    }
}
