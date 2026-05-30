<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'order_number'     => $this->order_number,
            'status'           => $this->status->value,
            'status_label'     => $this->status->label(),
            'shipping_address' => $this->shipping_address,
            'billing_address'  => $this->billing_address,
            'subtotal_cents'   => $this->subtotal_cents,
            'discount_cents'   => $this->discount_cents,
            'shipping_cents'   => $this->shipping_cents,
            'tax_cents'        => $this->tax_cents,
            'total_cents'      => $this->total_cents,
            'currency'         => $this->currency,
            'customer_notes'   => $this->customer_notes,
            'created_at'       => $this->created_at?->toISOString(),
            'paid_at'          => $this->paid_at?->toISOString(),
            'items'            => $this->whenLoaded('items', fn () =>
                $this->items->map(fn ($i) => (new OrderItemResource($i))->resolve())->values()->all()
            ),
            'coupon_code'      => $this->whenLoaded('coupon', fn () => $this->coupon?->code),
        ];
    }
}
