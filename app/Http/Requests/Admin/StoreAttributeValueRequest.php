<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAttributeValueRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasAnyRole(['staff', 'admin']);
    }

    public function rules(): array
    {
        $attributeId = $this->route('attribute')->id;

        return [
            'value'         => ['required', 'string', 'max:100',
                Rule::unique('attribute_values')->where('attribute_id', $attributeId),
            ],
            'display_value' => ['required', 'string', 'max:100'],
            'meta'          => ['nullable', 'array'],
            'sort_order'    => ['nullable', 'integer', 'min:0'],
        ];
    }
}
