<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RefundItem extends Model
{
    use HasFactory;

    protected $fillable = ['refund_id', 'order_item_id', 'quantity', 'amount_cents', 'reason'];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'amount_cents' => 'integer',
        ];
    }

    public function refund(): BelongsTo
    {
        return $this->belongsTo(Refund::class);
    }

    public function orderItem(): BelongsTo
    {
        return $this->belongsTo(OrderItem::class);
    }
}
