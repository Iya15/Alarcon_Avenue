<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Address extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'label', 'first_name', 'last_name', 'company',
        'line_1', 'line_2', 'city', 'state', 'postal_code',
        'country_code', 'phone', 'is_default_shipping', 'is_default_billing',
    ];

    protected function casts(): array
    {
        return [
            'is_default_shipping' => 'boolean',
            'is_default_billing' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function toSnapshot(): array
    {
        return $this->only([
            'first_name', 'last_name', 'company', 'line_1', 'line_2',
            'city', 'state', 'postal_code', 'country_code', 'phone',
        ]);
    }
}
