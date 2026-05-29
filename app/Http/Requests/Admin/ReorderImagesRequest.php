<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ReorderImagesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('product'));
    }

    public function rules(): array
    {
        return [
            'ordered_ids'   => ['required', 'array', 'min:1'],
            'ordered_ids.*' => ['integer', 'exists:product_images,id'],
        ];
    }
}
