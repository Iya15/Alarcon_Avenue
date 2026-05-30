<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DailyTrafficSummary extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = ['date', 'sessions', 'product_views'];

    protected function casts(): array
    {
        return [
            'sessions'      => 'integer',
            'product_views' => 'integer',
        ];
    }
}
