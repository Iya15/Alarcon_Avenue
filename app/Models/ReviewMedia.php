<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReviewMedia extends Model
{
    use HasFactory;

    protected $table = 'review_media';

    protected $fillable = ['review_id', 'path', 'type', 'sort_order'];

    protected function casts(): array
    {
        return ['sort_order' => 'integer'];
    }

    public function review(): BelongsTo
    {
        return $this->belongsTo(Review::class);
    }
}
