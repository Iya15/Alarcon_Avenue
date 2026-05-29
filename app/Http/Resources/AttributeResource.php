<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AttributeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'name'         => $this->name,
            'display_name' => $this->display_name,
            'type'         => $this->type,
            'sort_order'   => $this->sort_order,
            'values'       => AttributeValueResource::collection($this->whenLoaded('values')),
        ];
    }
}
