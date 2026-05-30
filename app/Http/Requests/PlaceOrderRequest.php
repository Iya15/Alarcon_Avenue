<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PlaceOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // guests allowed
    }

    public function rules(): array
    {
        $rules = [
            // ── Shipping address ──────────────────────────────────────────────
            'first_name'   => ['required', 'string', 'max:100'],
            'last_name'    => ['required', 'string', 'max:100'],
            'phone'        => ['required', 'string', 'max:30'],
            'line_1'       => ['required', 'string', 'max:255'],
            'line_2'       => ['nullable', 'string', 'max:255'],
            'city'         => ['required', 'string', 'max:100'],
            'state'        => ['required', 'string', 'max:100'],
            'postal_code'  => ['required', 'string', 'max:20'],
            'country_code' => ['required', 'string', 'size:2'],

            // ── Billing ───────────────────────────────────────────────────────
            'billing_same_as_shipping' => ['boolean'],

            // ── Payment stub ──────────────────────────────────────────────────
            'payment_method' => ['required', 'in:cod,gcash,maya,card'],

            // ── Notes ─────────────────────────────────────────────────────────
            'notes' => ['nullable', 'string', 'max:1000'],
        ];

        // Guest: require email
        if (! $this->user()) {
            $rules['email'] = ['required', 'email', 'max:255'];
        }

        // Separate billing address when not same as shipping
        if (! $this->boolean('billing_same_as_shipping', true)) {
            $rules = array_merge($rules, [
                'billing_first_name'   => ['required', 'string', 'max:100'],
                'billing_last_name'    => ['required', 'string', 'max:100'],
                'billing_phone'        => ['nullable', 'string', 'max:30'],
                'billing_line_1'       => ['required', 'string', 'max:255'],
                'billing_line_2'       => ['nullable', 'string', 'max:255'],
                'billing_city'         => ['required', 'string', 'max:100'],
                'billing_state'        => ['required', 'string', 'max:100'],
                'billing_postal_code'  => ['required', 'string', 'max:20'],
                'billing_country_code' => ['required', 'string', 'size:2'],
            ]);
        }

        return $rules;
    }

    public function shippingAddressArray(): array
    {
        return $this->only([
            'first_name', 'last_name', 'phone',
            'line_1', 'line_2', 'city', 'state', 'postal_code', 'country_code',
        ]);
    }

    public function billingAddressArray(): array
    {
        if ($this->boolean('billing_same_as_shipping', true)) {
            return $this->shippingAddressArray();
        }

        return [
            'first_name'   => $this->input('billing_first_name'),
            'last_name'    => $this->input('billing_last_name'),
            'phone'        => $this->input('billing_phone'),
            'line_1'       => $this->input('billing_line_1'),
            'line_2'       => $this->input('billing_line_2'),
            'city'         => $this->input('billing_city'),
            'state'        => $this->input('billing_state'),
            'postal_code'  => $this->input('billing_postal_code'),
            'country_code' => $this->input('billing_country_code'),
        ];
    }
}
