<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', \App\Models\Product::class);
    }

    public function rules(): array
    {
        return [
            'name'                   => ['required', 'string', 'max:255'],
            'slug'                   => ['nullable', 'string', 'max:255', 'unique:products,slug', 'regex:/^[a-z0-9-]+$/'],
            'description'            => ['nullable', 'string'],
            'short_description'      => ['nullable', 'string', 'max:500'],
            'base_price_cents'       => ['required', 'integer', 'min:0'],
            'compare_at_price_cents' => ['nullable', 'integer', 'min:0'],
            'cost_price_cents'       => ['nullable', 'integer', 'min:0'],
            'status'                 => ['required', 'in:draft,active,archived'],
            'is_featured'            => ['boolean'],
            'meta_title'             => ['nullable', 'string', 'max:255'],
            'meta_description'       => ['nullable', 'string', 'max:500'],
            'category_ids'           => ['nullable', 'array'],
            'category_ids.*'         => ['integer', 'exists:categories,id'],
            'images'                 => ['nullable', 'array', 'max:20'],
            'images.*'               => ['file', 'max:8192', 'mimes:jpeg,jpg,png,webp,avif'],
        ];
    }
}
