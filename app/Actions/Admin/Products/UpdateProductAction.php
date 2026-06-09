<?php

namespace App\Actions\Admin\Products;

use App\Models\Inventory;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class UpdateProductAction
{
    public function execute(Product $product, array $data): Product
    {
        return DB::transaction(function () use ($product, $data) {
            $categoryIds       = $data['category_ids'] ?? null;
            $variants          = $data['variants'] ?? null;
            $deletedVariantIds = array_filter(array_map('intval', $data['deleted_variant_ids'] ?? []));
            $attributes        = isset($data['attributes'])
                ? array_values(array_filter($data['attributes'], fn ($a) => !empty($a['key'])))
                : null;
            unset($data['category_ids'], $data['variants'], $data['deleted_variant_ids'], $data['attributes']);

            if (isset($data['slug'])) {
                $data['slug'] = Str::slug($data['slug']);
            } elseif (isset($data['name']) && $data['name'] !== $product->name) {
                $data['slug'] = $this->uniqueSlug(Str::slug($data['name']), $product->id);
            }

            $product->update($data);

            if ($categoryIds !== null) {
                $product->categories()->sync($categoryIds);
            }

            if ($attributes !== null) {
                $product->productAttributes()->delete();
                if (!empty($attributes)) {
                    $product->productAttributes()->createMany($attributes);
                }
            }

            if ($variants !== null) {
                foreach ($variants as $v) {
                    $id = isset($v['id']) ? (int) $v['id'] : null;

                    if ($id) {
                        // Update existing variant
                        ProductVariant::where('id', $id)
                            ->where('product_id', $product->id)
                            ->update([
                                'name'                => $v['name'] ?? null,
                                'sku'                 => $v['sku'] ?: ProductVariant::find($id)?->sku,
                                'price_override_cents' => isset($v['price_adjustment']) && (int) $v['price_adjustment'] !== 0
                                    ? (int) $v['price_adjustment']
                                    : null,
                            ]);

                        Inventory::where('product_variant_id', $id)
                            ->update(['quantity' => (int) ($v['stock_quantity'] ?? 0)]);
                    } else {
                        // Insert new variant
                        $sku = ! empty($v['sku'])
                            ? $v['sku']
                            : strtoupper(Str::random(4)) . '-' . strtoupper(Str::slug($v['name'] ?? 'var', '-'));

                        $variant = ProductVariant::create([
                            'product_id'          => $product->id,
                            'name'                => $v['name'] ?? null,
                            'sku'                 => $sku,
                            'price_override_cents' => isset($v['price_adjustment']) && (int) $v['price_adjustment'] !== 0
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
            }

            // Delete removed variants — but ensure at least one remains
            if (! empty($deletedVariantIds)) {
                $remaining = $product->variants()
                    ->whereNotIn('id', $deletedVariantIds)
                    ->count();

                if ($remaining > 0) {
                    ProductVariant::whereIn('id', $deletedVariantIds)
                        ->where('product_id', $product->id)
                        ->delete();
                }
            }

            return $product->fresh();
        });
    }

    private function uniqueSlug(string $base, int $excludeId): string
    {
        $slug = $base;
        $i    = 1;
        while (Product::withTrashed()->where('slug', $slug)->where('id', '!=', $excludeId)->exists()) {
            $slug = "{$base}-{$i}";
            $i++;
        }
        return $slug;
    }
}
