<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('category'));
    }

    public function rules(): array
    {
        $id = $this->route('category')->id;

        return [
            'name'        => ['required', 'string', 'max:150'],
            'slug'        => ['nullable', 'string', 'max:150', Rule::unique('categories', 'slug')->ignore($id), 'regex:/^[a-z0-9-]+$/'],
            'parent_id'   => ['nullable', 'integer', 'exists:categories,id', Rule::notIn([$id])],
            'description' => ['nullable', 'string', 'max:2000'],
            'sort_order'  => ['nullable', 'integer', 'min:0'],
            'is_active'   => ['boolean'],
            'image'       => ['nullable', 'image', 'max:4096', 'mimes:jpeg,jpg,png,webp'],
        ];
    }
}
