<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DailyProductStats extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = ['date', 'product_id', 'units_sold', 'revenue_cents'];

    protected function casts(): array
    {
        return [
            'date'          => 'date',
            'product_id'    => 'integer',
            'units_sold'    => 'integer',
            'revenue_cents' => 'integer',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
