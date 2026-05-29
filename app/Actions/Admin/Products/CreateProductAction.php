<?php

namespace App\Actions\Admin\Products;

use App\Models\Inventory;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Support\Str;

class CreateProductAction
{
    public function execute(array $data, ?int $userId = null): Product
    {
        $categoryIds = $data['category_ids'] ?? [];
        unset($data['category_ids']);

        $data['slug'] = ! empty($data['slug'] ?? null)
            ? Str::slug($data['slug'])
            : $this->uniqueSlug(Str::slug($data['name']));

        if ($userId) {
            $data['vendor_id'] = $userId;
        }

        $product = Product::create($data);

        if ($categoryIds) {
            $product->categories()->sync($categoryIds);
        }

        // Every product must have at least one default variant
        $variant = ProductVariant::create([
            'product_id' => $product->id,
            'sku'        => strtoupper(Str::random(3)) . '-' . strtoupper(Str::slug($data['name'], '-')) . '-DEFAULT',
            'is_active'  => true,
        ]);

        Inventory::create([
            'product_variant_id' => $variant->id,
            'quantity'           => 0,
            'reserved_quantity'  => 0,
        ]);

        return $product;
    }

    private function uniqueSlug(string $base): string
    {
        $slug = $base;
        $i    = 1;
        while (Product::withTrashed()->where('slug', $slug)->exists()) {
            $slug = "{$base}-{$i}";
            $i++;
        }
        return $slug;
    }
}
