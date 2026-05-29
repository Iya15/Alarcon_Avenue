<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductImageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('product'));
    }

    public function rules(): array
    {
        return [
            'images'                 => ['required', 'array', 'min:1', 'max:20'],
            'images.*'               => ['required', 'image', 'max:8192', 'mimes:jpeg,jpg,png,webp'],
            'variant_id'             => ['nullable', 'integer', 'exists:product_variants,id'],
            'alt_text'               => ['nullable', 'string', 'max:255'],
        ];
    }
}
