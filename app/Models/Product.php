<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Review;
use Illuminate\Support\Facades\Storage;
use Laravel\Scout\Searchable;

class Product extends Model
{
    use HasFactory, SoftDeletes, Searchable;

    protected $fillable = [
        'vendor_id', 'brand_id',
        'name', 'slug', 'description', 'short_description',
        'base_price_cents', 'compare_at_price_cents', 'cost_price_cents',
        'status', 'is_featured', 'meta_title', 'meta_description',
        'rating_average', 'review_count',
    ];

    protected function casts(): array
    {
        return [
            'base_price_cents'       => 'integer',
            'compare_at_price_cents' => 'integer',
            'cost_price_cents'       => 'integer',
            'is_featured'            => 'boolean',
            'rating_average'         => 'float',
            'review_count'           => 'integer',
        ];
    }

    // ── Relationships ─────────────────────────────────────────────────────────

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'vendor_id');
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class)->withTimestamps();
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function activeVariants(): HasMany
    {
        return $this->hasMany(ProductVariant::class)->where('is_active', true);
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order');
    }

    public function primaryImage(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(ProductImage::class)->where('is_primary', true);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function publishedReviews(): HasMany
    {
        return $this->hasMany(Review::class)->where('status', Review::STATUS_PUBLISHED);
    }

    public function productAttributes(): HasMany
    {
        return $this->hasMany(ProductAttribute::class)->orderBy('id');
    }

    public function recommendations(): HasMany
    {
        return $this->hasMany(\App\Models\ProductRecommendation::class)
            ->orderByDesc('score');
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    public function isVendorProduct(): bool
    {
        return $this->vendor_id !== null;
    }

    public function recalculateRating(): void
    {
        $query   = $this->publishedReviews();
        $average = $query->avg('rating');
        $count   = $query->count();

        $this->updateQuietly([
            'rating_average' => $average !== null ? round((float) $average, 2) : null,
            'review_count'   => $count,
        ]);

        $this->searchable();
    }

    // ── Scout ─────────────────────────────────────────────────────────────────

    public function shouldBeSearchable(): bool
    {
        return $this->status === 'active' && $this->deleted_at === null;
    }

    public function makeAllSearchableUsing(Builder $query): Builder
    {
        return $query->with([
            'brand',
            'categories',
            'primaryImage',
            'variants.inventory',
            'variants.attributeValues.attribute',
        ]);
    }

    public function toSearchableArray(): array
    {
        $this->loadMissing([
            'brand',
            'categories',
            'primaryImage',
            'variants.inventory',
            'variants.attributeValues.attribute',
        ]);

        $activeVariants = $this->variants->where('is_active', true);

        $lowestPrice = $activeVariants->min(fn ($v) =>
            $v->price_override_cents ?? $this->base_price_cents
        ) ?? $this->base_price_cents;

        $inStock = $activeVariants->contains(
            fn ($v) => ($v->inventory?->available ?? 0) > 0
        );

        $allValues = $activeVariants->flatMap->attributeValues;

        $attrValues = fn (string $attrName) => $allValues
            ->filter(fn ($av) => $av->attribute?->name === $attrName)
            ->pluck('value')
            ->unique()
            ->values()
            ->all();

        $primaryImageUrl = $this->primaryImage?->path
            ? Storage::disk('media')->url($this->primaryImage->path)
            : null;

        $hasDiscount = $this->compare_at_price_cents
            && $this->compare_at_price_cents > $this->base_price_cents;

        return [
            'id'                         => $this->id,
            'name'                       => $this->name,
            'slug'                       => $this->slug,
            'description'                => strip_tags($this->description ?? ''),
            'short_description'          => $this->short_description,
            'status'                     => $this->status,

            'base_price_cents'           => $this->base_price_cents,
            'lowest_variant_price_cents' => $lowestPrice,
            'compare_at_price_cents'     => $this->compare_at_price_cents,
            'has_discount'               => $hasDiscount,
            'discount_percent'           => $hasDiscount
                ? (int) round((1 - $this->base_price_cents / $this->compare_at_price_cents) * 100)
                : 0,

            'brand_id'   => $this->brand_id,
            'brand_name' => $this->brand?->name,
            'brand_slug' => $this->brand?->slug,

            'category_ids'   => $this->categories->pluck('id')->values()->all(),
            'category_names' => $this->categories->pluck('name')->values()->all(),
            'category_slugs' => $this->categories->pluck('slug')->values()->all(),

            'colors'    => $attrValues('color'),
            'sizes'     => $attrValues('size'),
            'materials' => $attrValues('material'),

            'in_stock'   => $inStock,
            'is_featured' => $this->is_featured,

            'rating_average' => $this->rating_average,
            'review_count'   => $this->review_count,

            'primary_image_url' => $primaryImageUrl,

            'created_at' => $this->created_at?->timestamp,
        ];
    }
}
