<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WishlistItem extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = ['wishlist_id', 'product_id', 'product_variant_id', 'created_at'];

    protected function casts(): array
    {
        return ['created_at' => 'datetime'];
    }

    public function wishlist(): BelongsTo
    {
        return $this->belongsTo(Wishlist::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }
}
