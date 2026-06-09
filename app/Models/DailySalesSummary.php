<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DailySalesSummary extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'date', 'orders_count', 'completed_count', 'gross_cents', 'net_cents', 'refunds_cents', 'items_sold',
    ];

    protected function casts(): array
    {
        return [
            'orders_count'    => 'integer',
            'completed_count' => 'integer',
            'gross_cents'   => 'integer',
            'net_cents'     => 'integer',
            'refunds_cents' => 'integer',
            'items_sold'    => 'integer',
        ];
    }
}
