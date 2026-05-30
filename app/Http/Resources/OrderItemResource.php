<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class OrderItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $imagePath = $this->variant?->images->first()?->path
            ?? $this->product?->primaryImage?->path;

        return [
            'id'                => $this->id,
            'product_name'      => $this->product_name,
            'variant_label'     => $this->variant_label,
            'sku'               => $this->sku,
            'unit_price_cents'  => $this->unit_price_cents,
            'quantity'          => $this->quantity,
            'subtotal_cents'    => $this->subtotal_cents,
            'image_url'         => $imagePath ? Storage::disk('media')->url($imagePath) : null,
            'product_slug'      => $this->product?->slug,
        ];
    }
}
