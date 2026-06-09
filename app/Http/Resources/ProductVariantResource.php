<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductVariantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                     => $this->id,
            'name'                   => $this->name,
            'sku'                    => $this->sku,
            'is_active'              => $this->is_active,
            'price_override_cents'   => $this->price_override_cents,
            'compare_at_price_cents' => $this->compare_at_price_cents,
            'cost_price_cents'       => $this->cost_price_cents,
            'effective_price'        => $this->effective_price,
            'weight_grams'           => $this->weight_grams,
            'attribute_values' => $this->whenLoaded('attributeValues', fn () =>
                $this->attributeValues->map(fn ($av) => (new AttributeValueResource($av))->resolve())->values()->all()
            ),
            'inventory' => $this->whenLoaded('inventory', fn () =>
                $this->inventory ? (new InventoryResource($this->inventory))->resolve() : null
            ),
            'images' => $this->whenLoaded('images', fn () =>
                $this->images->map(fn ($i) => (new ProductImageResource($i))->resolve())->values()->all()
            ),
        ];
    }
}
