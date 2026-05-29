<?php

namespace App\Actions\Admin\Variants;

use App\Models\Inventory;
use App\Models\Product;
use App\Models\ProductVariant;

class CreateVariantAction
{
    public function execute(Product $product, array $data): ProductVariant
    {
        $attributeValueIds = $data['attribute_value_ids'] ?? [];
        $initialQuantity   = $data['initial_quantity'] ?? 0;
        unset($data['attribute_value_ids'], $data['initial_quantity']);

        $data['product_id'] = $product->id;
        $variant = ProductVariant::create($data);

        if ($attributeValueIds) {
            $variant->attributeValues()->sync($attributeValueIds);
        }

        Inventory::create([
            'product_variant_id' => $variant->id,
            'quantity'           => $initialQuantity,
            'reserved_quantity'  => 0,
        ]);

        return $variant->load(['attributeValues', 'inventory']);
    }
}
