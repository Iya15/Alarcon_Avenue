<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProductVariant extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'product_id', 'sku', 'price_override_cents',
        'compare_at_price_cents', 'cost_price_cents',
        'weight_grams', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'price_override_cents' => 'integer',
            'compare_at_price_cents' => 'integer',
            'cost_price_cents' => 'integer',
            'weight_grams' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function attributeValues(): BelongsToMany
    {
        return $this->belongsToMany(AttributeValue::class, 'variant_attribute_values');
    }

    public function inventory(): HasOne
    {
        return $this->hasOne(Inventory::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class, 'product_variant_id');
    }

    public function cartItems(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function getEffectivePriceAttribute(): int
    {
        return $this->price_override_cents ?? $this->product->base_price_cents;
    }
}
