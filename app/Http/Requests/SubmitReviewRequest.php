<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SubmitReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'rating'    => ['required', 'integer', 'min:1', 'max:5'],
            'title'     => ['nullable', 'string', 'max:150'],
            'body'      => ['nullable', 'string', 'max:2000'],
            'photos'    => ['nullable', 'array', 'max:5'],
            'photos.*'  => ['file', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ];
    }

    protected function prepareForValidation(): void
    {
        // Strip all HTML from user-submitted text fields — reviews are plain text only
        if ($this->has('title')) {
            $this->merge(['title' => strip_tags($this->input('title', ''))]);
        }
        if ($this->has('body')) {
            $this->merge(['body' => strip_tags($this->input('body', ''))]);
        }
    }
}
