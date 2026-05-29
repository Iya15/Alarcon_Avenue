<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Review extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'product_id', 'order_item_id',
        'rating', 'title', 'body', 'is_approved', 'helpful_count',
    ];

    protected function casts(): array
    {
        return [
            'rating' => 'integer',
            'is_approved' => 'boolean',
            'helpful_count' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function orderItem(): BelongsTo
    {
        return $this->belongsTo(OrderItem::class);
    }

    public function media(): HasMany
    {
        return $this->hasMany(ReviewMedia::class)->orderBy('sort_order');
    }
}
