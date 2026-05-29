<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAttributeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasAnyRole(['staff', 'admin']);
    }

    public function rules(): array
    {
        $id = $this->route('attribute')->id;

        return [
            'name'         => ['required', 'string', 'max:100', Rule::unique('attributes', 'name')->ignore($id)],
            'display_name' => ['required', 'string', 'max:100'],
            'type'         => ['required', 'in:select,color_swatch,button'],
            'sort_order'   => ['nullable', 'integer', 'min:0'],
        ];
    }
}
