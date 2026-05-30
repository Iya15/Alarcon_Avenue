<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SearchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'q'          => ['nullable', 'string', 'max:200'],
            'sort'       => ['nullable', 'in:relevance,price_asc,price_desc,newest,rating,featured'],
            'page'       => ['nullable', 'integer', 'min:1', 'max:100'],
            'categories' => ['nullable', 'array'],
            'categories.*' => ['integer', 'min:1'],
            'brand_ids'  => ['nullable', 'array'],
            'brand_ids.*' => ['integer', 'min:1'],
            'colors'     => ['nullable', 'array'],
            'colors.*'   => ['string', 'max:50'],
            'sizes'      => ['nullable', 'array'],
            'sizes.*'    => ['string', 'max:20'],
            'materials'  => ['nullable', 'array'],
            'materials.*' => ['string', 'max:50'],
            'in_stock'   => ['nullable', 'boolean'],
            'has_discount' => ['nullable', 'boolean'],
            'price_min'  => ['nullable', 'integer', 'min:0'],
            'price_max'  => ['nullable', 'integer', 'min:0'],
            'rating_min' => ['nullable', 'numeric', 'min:1', 'max:5'],
        ];
    }

    protected function prepareForValidation(): void
    {
        // Cast boolean strings that arrive as "1"/"0" from URL
        foreach (['in_stock', 'has_discount'] as $field) {
            if ($this->has($field)) {
                $this->merge([$field => filter_var($this->input($field), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? false]);
            }
        }
    }

    public function activeFilters(): array
    {
        return array_filter([
            'q'           => $this->input('q'),
            'categories'  => $this->input('categories'),
            'brand_ids'   => $this->input('brand_ids'),
            'colors'      => $this->input('colors'),
            'sizes'       => $this->input('sizes'),
            'materials'   => $this->input('materials'),
            'in_stock'    => $this->boolean('in_stock') ?: null,
            'has_discount' => $this->boolean('has_discount') ?: null,
            'price_min'   => $this->input('price_min'),
            'price_max'   => $this->input('price_max'),
            'rating_min'  => $this->input('rating_min'),
            'sort'        => $this->input('sort', 'relevance'),
        ]);
    }
}
