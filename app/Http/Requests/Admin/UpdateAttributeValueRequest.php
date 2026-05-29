<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAttributeValueRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasAnyRole(['staff', 'admin']);
    }

    public function rules(): array
    {
        $value = $this->route('attributeValue');

        return [
            'value'         => ['required', 'string', 'max:100',
                Rule::unique('attribute_values')
                    ->where('attribute_id', $value->attribute_id)
                    ->ignore($value->id),
            ],
            'display_value' => ['required', 'string', 'max:100'],
            'meta'          => ['nullable', 'array'],
            'sort_order'    => ['nullable', 'integer', 'min:0'],
        ];
    }
}
