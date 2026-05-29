<?php

namespace App\Actions\Admin\Products;

use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class UploadProductImageAction
{
    public function execute(Product $product, array $files, ?int $variantId = null, ?string $altText = null): array
    {
        $nextOrder = $product->images()->max('sort_order') + 1;
        $hasPrimary = $product->images()->where('is_primary', true)->exists();
        $created = [];

        foreach ($files as $i => $file) {
            /** @var UploadedFile $file */
            $path = $file->store("products/{$product->id}", 'media');

            $image = ProductImage::create([
                'product_id'         => $product->id,
                'product_variant_id' => $variantId,
                'path'               => $path,
                'alt_text'           => $altText ?? $product->name,
                'sort_order'         => $nextOrder + $i,
                'is_primary'         => ! $hasPrimary && $i === 0,
            ]);

            if (! $hasPrimary && $i === 0) {
                $hasPrimary = true;
            }

            $created[] = $image;
        }

        return $created;
    }
}
