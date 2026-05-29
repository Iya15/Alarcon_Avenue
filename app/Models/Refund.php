<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Refund extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id', 'payment_id', 'refunded_by',
        'reason', 'notes', 'total_cents', 'status', 'processed_at',
    ];

    protected function casts(): array
    {
        return [
            'total_cents' => 'integer',
            'processed_at' => 'datetime',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }

    public function processedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'refunded_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(RefundItem::class);
    }
}
