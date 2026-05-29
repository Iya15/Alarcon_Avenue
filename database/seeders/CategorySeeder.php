<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $tree = [
            'Clothing' => ['Men\'s', 'Women\'s', 'Kids\'', 'Activewear', 'Formal Wear'],
            'Footwear' => ['Sneakers', 'Sandals', 'Boots', 'Formal Shoes'],
            'Accessories' => ['Bags', 'Watches', 'Jewelry', 'Belts', 'Sunglasses'],
            'Electronics' => ['Phones', 'Laptops', 'Tablets', 'Headphones', 'Accessories'],
            'Home & Living' => ['Furniture', 'Kitchen', 'Bedding', 'Decor'],
            'Sports' => ['Gym Equipment', 'Outdoor', 'Team Sports'],
        ];

        foreach ($tree as $parentName => $children) {
            $parent = Category::create([
                'parent_id' => null,
                'name' => $parentName,
                'slug' => Str::slug($parentName),
                'is_active' => true,
                'sort_order' => 0,
            ]);

            foreach ($children as $i => $childName) {
                Category::create([
                    'parent_id' => $parent->id,
                    'name' => $childName,
                    'slug' => Str::slug($parentName . '-' . $childName),
                    'is_active' => true,
                    'sort_order' => $i,
                ]);
            }
        }
    }
}
