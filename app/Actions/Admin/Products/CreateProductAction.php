<?php

namespace App\Actions\Admin\Products;

use App\Models\Inventory;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CreateProductAction
{
    public function execute(array $data, ?int $userId = null): Product
    {
        return DB::transaction(function () use ($data, $userId) {
            $categoryIds = $data['category_ids'] ?? [];
            $variants    = $data['variants'] ?? [];
            $attributes  = array_filter($data['attributes'] ?? [], fn ($a) => !empty($a['key']));
            unset($data['category_ids'], $data['variants'], $data['deleted_variant_ids'], $data['attributes']);

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

            if (!empty($attributes)) {
                $product->productAttributes()->createMany($attributes);
            }

            if (empty($variants)) {
                // Default variant so every product has at least one
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
            } else {
                foreach ($variants as $v) {
                    $sku = ! empty($v['sku'])
                        ? $v['sku']
                        : strtoupper(Str::random(4)) . '-' . strtoupper(Str::slug($v['name'] ?? 'var', '-'));

                    $variant = ProductVariant::create([
                        'product_id'          => $product->id,
                        'name'                => $v['name'] ?? null,
                        'sku'                 => $sku,
                        'price_override_cents' => isset($v['price_adjustment']) && $v['price_adjustment'] !== 0
                            ? (int) $v['price_adjustment']
                            : null,
                        'is_active'           => true,
                    ]);

                    Inventory::create([
                        'product_variant_id' => $variant->id,
                        'quantity'           => (int) ($v['stock_quantity'] ?? 0),
                        'reserved_quantity'  => 0,
                    ]);
                }
            }

            return $product;
        });
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
