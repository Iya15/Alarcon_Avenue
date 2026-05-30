<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AddressResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                  => $this->id,
            'label'               => $this->label,
            'first_name'          => $this->first_name,
            'last_name'           => $this->last_name,
            'company'             => $this->company,
            'line_1'              => $this->line_1,
            'line_2'              => $this->line_2,
            'city'                => $this->city,
            'state'               => $this->state,
            'postal_code'         => $this->postal_code,
            'country_code'        => $this->country_code,
            'phone'               => $this->phone,
            'is_default_shipping' => $this->is_default_shipping,
            'is_default_billing'  => $this->is_default_billing,
        ];
    }
}
