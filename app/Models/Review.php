<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Review extends Model
{
    use HasFactory;

    // ── Status constants ──────────────────────────────────────────────────────
    const STATUS_PENDING   = 'pending';
    const STATUS_PUBLISHED = 'published';
    const STATUS_REJECTED  = 'rejected';

    protected $fillable = [
        'user_id', 'product_id', 'order_item_id',
        'rating', 'title', 'body',
        'status', 'verified_purchase', 'rejection_reason', 'helpful_count',
    ];

    protected function casts(): array
    {
        return [
            'rating'             => 'integer',
            'helpful_count'      => 'integer',
            'verified_purchase'  => 'boolean',
        ];
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    public function isPublished(): bool { return $this->status === self::STATUS_PUBLISHED; }
    public function isPending(): bool   { return $this->status === self::STATUS_PENDING; }

    // ── Relationships ─────────────────────────────────────────────────────────

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

    public function votes(): HasMany
    {
        return $this->hasMany(ReviewVote::class);
    }

    public function voters(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'review_votes')->withTimestamps();
    }
}
