<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AssistantMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // guests may use the assistant
    }

    public function rules(): array
    {
        return [
            'message'          => ['required', 'string', 'max:1000'],
            // Up to 20 prior turns for context window management
            'history'          => ['sometimes', 'array', 'max:20'],
            'history.*.role'   => ['required_with:history', 'in:user,assistant'],
            'history.*.content' => ['required_with:history', 'string', 'max:2000'],
        ];
    }
}
