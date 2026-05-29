<?php

namespace App\Actions\Admin\Attributes;

use App\Models\Attribute;

class CreateAttributeAction
{
    public function execute(array $data): Attribute
    {
        $values = $data['values'] ?? [];
        unset($data['values']);

        $attribute = Attribute::create($data);

        foreach ($values as $i => $valueData) {
            $attribute->values()->create(array_merge($valueData, ['sort_order' => $i]));
        }

        return $attribute->load('values');
    }
}
