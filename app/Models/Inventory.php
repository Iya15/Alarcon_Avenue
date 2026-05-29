<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Inventory extends Model
{
    use HasFactory;

    protected $table = 'inventory';

    protected $fillable = [
        'product_variant_id', 'quantity', 'reserved_quantity', 'low_stock_threshold',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'reserved_quantity' => 'integer',
            'low_stock_threshold' => 'integer',
        ];
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }

    public function getAvailableAttribute(): int
    {
        return max(0, $this->quantity - $this->reserved_quantity);
    }

    public function isLowStock(): bool
    {
        return $this->low_stock_threshold !== null
            && $this->available <= $this->low_stock_threshold;
    }
}
