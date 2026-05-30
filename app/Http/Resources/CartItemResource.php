<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class CartItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $variant  = $this->variant;
        $product  = $variant?->product;
        $inventory = $variant?->inventory;

        // Prefer variant-specific image; fall back to product primary image
        $imagePath = $variant?->images->first()?->path
            ?? $product?->primaryImage?->path;

        $imageUrl = $imagePath ? Storage::disk('media')->url($imagePath) : null;

        $variantLabel = $variant?->attributeValues
            ->sortBy(fn ($av) => $av->attribute?->sort_order ?? 0)
            ->map(fn ($av) => $av->display_value)
            ->filter()
            ->implode(' / ') ?: null;

        return [
            'id'               => $this->id,
            'variant_id'       => $this->product_variant_id,
            'product_id'       => $product?->id,
            'slug'             => $product?->slug,
            'sku'              => $variant?->sku,
            'product_name'     => $product?->name,
            'brand_name'       => $product?->brand?->name,
            'variant_label'    => $variantLabel,
            'image_url'        => $imageUrl,
            'unit_price_cents' => $this->unit_price_cents,
            'quantity'         => $this->quantity,
            'line_total_cents' => $this->line_total,
            'saved_for_later'  => $this->saved_for_later,
            'in_stock'         => ($inventory?->available ?? 0) > 0,
            'available'        => $inventory?->available ?? 0,
        ];
    }
}
