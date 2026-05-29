<?php

namespace App\Actions\Admin\Products;

use App\Models\Product;
use Illuminate\Support\Str;

class UpdateProductAction
{
    public function execute(Product $product, array $data): Product
    {
        $categoryIds = $data['category_ids'] ?? null;
        unset($data['category_ids']);

        if (isset($data['slug'])) {
            $data['slug'] = Str::slug($data['slug']);
        } elseif (isset($data['name']) && $data['name'] !== $product->name) {
            $data['slug'] = $this->uniqueSlug(Str::slug($data['name']), $product->id);
        }

        $product->update($data);

        if ($categoryIds !== null) {
            $product->categories()->sync($categoryIds);
        }

        return $product->fresh();
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
