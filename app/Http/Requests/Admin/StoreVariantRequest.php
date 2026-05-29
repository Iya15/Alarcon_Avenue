<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreVariantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('product'));
    }

    public function rules(): array
    {
        return [
            'sku'                    => ['required', 'string', 'max:100', 'unique:product_variants,sku'],
            'price_override_cents'   => ['nullable', 'integer', 'min:0'],
            'compare_at_price_cents' => ['nullable', 'integer', 'min:0'],
            'cost_price_cents'       => ['nullable', 'integer', 'min:0'],
            'weight_grams'           => ['nullable', 'integer', 'min:0'],
            'is_active'              => ['boolean'],
            'attribute_value_ids'    => ['nullable', 'array'],
            'attribute_value_ids.*'  => ['integer', 'exists:attribute_values,id'],
            'initial_quantity'       => ['nullable', 'integer', 'min:0'],
        ];
    }
}
