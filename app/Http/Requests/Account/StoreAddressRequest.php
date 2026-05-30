<?php

namespace App\Http\Requests\Account;

use Illuminate\Foundation\Http\FormRequest;

class StoreAddressRequest extends FormRequest
{
    public function authorize(): bool { return $this->user() !== null; }

    public function rules(): array
    {
        return [
            'label'                   => ['nullable', 'string', 'max:50'],
            'first_name'              => ['required', 'string', 'max:100'],
            'last_name'               => ['required', 'string', 'max:100'],
            'company'                 => ['nullable', 'string', 'max:100'],
            'line_1'                  => ['required', 'string', 'max:255'],
            'line_2'                  => ['nullable', 'string', 'max:255'],
            'city'                    => ['required', 'string', 'max:100'],
            'state'                   => ['required', 'string', 'max:100'],
            'postal_code'             => ['required', 'string', 'max:20'],
            'country_code'            => ['required', 'string', 'size:2'],
            'phone'                   => ['nullable', 'string', 'max:30'],
            'is_default_shipping'     => ['boolean'],
            'is_default_billing'      => ['boolean'],
        ];
    }
}
