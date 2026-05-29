<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateVariantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('variant')->product);
    }

    public function rules(): array
    {
        $id = $this->route('variant')->id;

        return [
            'sku'                    => ['required', 'string', 'max:100', Rule::unique('product_variants', 'sku')->ignore($id)],
            'price_override_cents'   => ['nullable', 'integer', 'min:0'],
            'compare_at_price_cents' => ['nullable', 'integer', 'min:0'],
            'cost_price_cents'       => ['nullable', 'integer', 'min:0'],
            'weight_grams'           => ['nullable', 'integer', 'min:0'],
            'is_active'              => ['boolean'],
            'attribute_value_ids'    => ['nullable', 'array'],
            'attribute_value_ids.*'  => ['integer', 'exists:attribute_values,id'],
        ];
    }
}
