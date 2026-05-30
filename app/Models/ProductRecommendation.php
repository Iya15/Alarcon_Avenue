<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductRecommendation extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'recommended_product_id',
        'score',
        'reason',
    ];

    protected function casts(): array
    {
        return [
            'score' => 'float',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function recommended(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'recommended_product_id');
    }
}
