<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id', 'gateway', 'gateway_transaction_id', 'gateway_payment_intent_id',
        'amount_cents', 'currency', 'status', 'method', 'last_four', 'metadata',
        'captured_at', 'failed_at', 'refunded_at',
    ];

    protected function casts(): array
    {
        return [
            'amount_cents' => 'integer',
            'metadata' => 'array',
            'captured_at' => 'datetime',
            'failed_at' => 'datetime',
            'refunded_at' => 'datetime',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function refunds(): HasMany
    {
        return $this->hasMany(Refund::class);
    }
}
