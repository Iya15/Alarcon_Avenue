<?php

namespace Database\Seeders;

use App\Models\Attribute;
use App\Models\AttributeValue;
use App\Models\Category;
use App\Models\Inventory;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $categories = Category::whereNotNull('parent_id')->get();
        $colorAttr = Attribute::where('name', 'color')->first();
        $sizeAttr = Attribute::where('name', 'size')->first();

        $colors = AttributeValue::where('attribute_id', $colorAttr->id)->get();
        $sizes = AttributeValue::where('attribute_id', $sizeAttr->id)->get();

        for ($i = 0; $i < 30; $i++) {
            $category = $categories->random();
            $baseName = fake()->words(fake()->numberBetween(2, 4), true);
            $basePrice = fake()->numberBetween(29900, 499900);

            $product = Product::create([
                'name' => ucwords($baseName),
                'slug' => Str::slug($baseName) . '-' . ($i + 1),
                'description' => fake()->paragraphs(2, true),
                'short_description' => fake()->sentence(12),
                'base_price_cents' => $basePrice,
                'compare_at_price_cents' => fake()->boolean(30) ? (int) ($basePrice * 1.3) : null,
                'cost_price_cents' => (int) ($basePrice * 0.4),
                'status' => 'active',
                'is_featured' => $i < 5,
            ]);

            $product->categories()->attach($category->id);

            ProductImage::create([
                'product_id' => $product->id,
                'product_variant_id' => null,
                'path' => 'products/placeholder-' . ($i + 1) . '.jpg',
                'alt_text' => $product->name,
                'sort_order' => 0,
                'is_primary' => true,
            ]);

            $selectedColors = $colors->random(fake()->numberBetween(1, 3));
            $selectedSizes = $sizes->random(fake()->numberBetween(2, 4));

            foreach ($selectedColors as $colorVal) {
                foreach ($selectedSizes as $sizeVal) {
                    $sku = strtoupper(Str::random(3))
                        . '-' . strtoupper($colorVal->value)
                        . '-' . strtoupper($sizeVal->value)
                        . '-' . fake()->unique()->numberBetween(1000, 9999);

                    $variant = ProductVariant::create([
                        'product_id' => $product->id,
                        'sku' => $sku,
                        'price_override_cents' => null,
                        'is_active' => true,
                    ]);

                    $variant->attributeValues()->attach([
                        $colorVal->id,
                        $sizeVal->id,
                    ]);

                    Inventory::create([
                        'product_variant_id' => $variant->id,
                        'quantity' => fake()->numberBetween(0, 150),
                        'reserved_quantity' => 0,
                        'low_stock_threshold' => 5,
                    ]);
                }
            }
        }
    }
}
