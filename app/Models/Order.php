<?php

namespace App\Models;

use App\Enums\OrderStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'guest_email', 'order_number', 'status',
        'shipping_address', 'billing_address', 'coupon_id',
        'subtotal_cents', 'discount_cents', 'shipping_cents', 'tax_cents', 'total_cents',
        'currency', 'customer_notes', 'admin_notes',
        'paid_at', 'shipped_at', 'delivered_at', 'cancelled_at',
    ];

    protected function casts(): array
    {
        return [
            'shipping_address' => 'array',
            'billing_address'  => 'array',
            'subtotal_cents'   => 'integer',
            'discount_cents'   => 'integer',
            'shipping_cents'   => 'integer',
            'tax_cents'        => 'integer',
            'total_cents'      => 'integer',
            'status'           => OrderStatus::class,
            'paid_at'          => 'datetime',
            'shipped_at'       => 'datetime',
            'delivered_at'     => 'datetime',
            'cancelled_at'     => 'datetime',
        ];
    }

    // ── Status helpers ────────────────────────────────────────────────────────

    public function isPending(): bool       { return $this->status === OrderStatus::Pending; }
    public function isPaid(): bool          { return $this->status === OrderStatus::Paid; }
    public function isShipped(): bool       { return $this->status === OrderStatus::Shipped; }
    public function isCancelled(): bool     { return $this->status === OrderStatus::Cancelled; }
    public function canBeCancelled(): bool  { return $this->status->canCancel(); }

    public function markPaid(): void
    {
        $this->update(['status' => OrderStatus::Paid, 'paid_at' => now()]);
    }

    public function markShipped(): void
    {
        $this->update(['status' => OrderStatus::Shipped, 'shipped_at' => now()]);
    }

    public function markDelivered(): void
    {
        $this->update(['status' => OrderStatus::Delivered, 'delivered_at' => now()]);
    }

    public function markCancelled(): void
    {
        $this->update(['status' => OrderStatus::Cancelled, 'cancelled_at' => now()]);
    }

    // ── Order number generation ───────────────────────────────────────────────

    public static function generateOrderNumber(): string
    {
        do {
            $number = 'AA-' . strtoupper(Str::random(8));
        } while (static::where('order_number', $number)->exists());

        return $number;
    }

    // ── Relationships ─────────────────────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function coupon(): BelongsTo
    {
        return $this->belongsTo(Coupon::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function refunds(): HasMany
    {
        return $this->hasMany(Refund::class);
    }

    public function couponUsage(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(CouponUsage::class);
    }
}
