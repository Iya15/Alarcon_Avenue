<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreCouponRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasAnyRole(['admin', 'staff']);
    }

    public function rules(): array
    {
        return [
            'code'               => ['required', 'string', 'max:50', 'unique:coupons,code'],
            'discount_type'      => ['required', 'in:percent,fixed,free_shipping'],
            'discount_value'     => ['required', 'integer', 'min:0'],
            'min_order_cents'    => ['nullable', 'integer', 'min:0'],
            'max_uses'           => ['nullable', 'integer', 'min:1'],
            'max_uses_per_user'  => ['nullable', 'integer', 'min:1'],
            'is_active'          => ['boolean'],
            'starts_at'          => ['nullable', 'date'],
            'expires_at'         => ['nullable', 'date', 'after_or_equal:starts_at'],
        ];
    }
}
