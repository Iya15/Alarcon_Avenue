<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id', 'product_id', 'product_variant_id',
        'product_name', 'variant_label', 'sku',
        'unit_price_cents', 'quantity', 'subtotal_cents',
    ];

    protected function casts(): array
    {
        return [
            'unit_price_cents' => 'integer',
            'quantity' => 'integer',
            'subtotal_cents' => 'integer',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }

    public function refundItems(): HasMany
    {
        return $this->hasMany(RefundItem::class);
    }

    public function review(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Review::class);
    }
}
