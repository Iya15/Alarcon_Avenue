<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InventoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'quantity'            => $this->quantity,
            'reserved_quantity'   => $this->reserved_quantity,
            'available'           => $this->available,
            'low_stock_threshold' => $this->low_stock_threshold,
            'is_low_stock'        => $this->isLowStock(),
            'in_stock'            => $this->available > 0,
        ];
    }
}
