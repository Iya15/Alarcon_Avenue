<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreAttributeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasAnyRole(['staff', 'admin']);
    }

    public function rules(): array
    {
        return [
            'name'         => ['required', 'string', 'max:100', 'unique:attributes,name'],
            'display_name' => ['required', 'string', 'max:100'],
            'type'         => ['required', 'in:select,color_swatch,button'],
            'sort_order'   => ['nullable', 'integer', 'min:0'],
            'values'       => ['nullable', 'array'],
            'values.*.value'         => ['required_with:values', 'string', 'max:100'],
            'values.*.display_value' => ['required_with:values', 'string', 'max:100'],
            'values.*.meta'          => ['nullable', 'array'],
            'values.*.sort_order'    => ['nullable', 'integer'],
        ];
    }
}
