<?php

namespace App\Actions\Admin\Variants;

use App\Models\ProductVariant;

class UpdateVariantAction
{
    public function execute(ProductVariant $variant, array $data): ProductVariant
    {
        $attributeValueIds = $data['attribute_value_ids'] ?? null;
        unset($data['attribute_value_ids']);

        $variant->update($data);

        if ($attributeValueIds !== null) {
            $variant->attributeValues()->sync($attributeValueIds);
        }

        return $variant->fresh(['attributeValues', 'inventory']);
    }
}
