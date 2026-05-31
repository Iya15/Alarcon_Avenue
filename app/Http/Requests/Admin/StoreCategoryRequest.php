<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', \App\Models\Category::class);
    }

    public function rules(): array
    {
        return [
            'name'        => ['required', 'string', 'max:150'],
            'slug'        => ['nullable', 'string', 'max:150', 'unique:categories,slug', 'regex:/^[a-z0-9-]+$/'],
            'parent_id'   => ['nullable', 'integer', 'exists:categories,id'],
            'description' => ['nullable', 'string', 'max:2000'],
            'sort_order'  => ['nullable', 'integer', 'min:0'],
            'is_active'       => ['boolean'],
            'is_nav_featured' => ['boolean'],
            'image'       => ['nullable', 'image', 'max:4096', 'mimes:jpeg,jpg,png,webp'],
        ];
    }
}
