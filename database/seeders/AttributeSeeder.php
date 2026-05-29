<?php

namespace Database\Seeders;

use App\Models\Attribute;
use App\Models\AttributeValue;
use Illuminate\Database\Seeder;

class AttributeSeeder extends Seeder
{
    public function run(): void
    {
        $color = Attribute::create([
            'name' => 'color',
            'display_name' => 'Color',
            'type' => 'color_swatch',
            'sort_order' => 1,
        ]);

        foreach ([
            ['Black', '#000000'],
            ['White', '#FFFFFF'],
            ['Yellow', '#E7901D'],
            ['Red', '#DC2626'],
            ['Blue', '#2563EB'],
            ['Green', '#16A34A'],
            ['Navy', '#1E3A5F'],
            ['Gray', '#6B7280'],
        ] as [$name, $hex]) {
            AttributeValue::create([
                'attribute_id' => $color->id,
                'value' => strtolower($name),
                'display_value' => $name,
                'meta' => ['hex' => $hex],
                'sort_order' => 0,
            ]);
        }

        $size = Attribute::create([
            'name' => 'size',
            'display_name' => 'Size',
            'type' => 'button',
            'sort_order' => 2,
        ]);

        foreach (['XS', 'S', 'M', 'L', 'XL', 'XXL'] as $i => $s) {
            AttributeValue::create([
                'attribute_id' => $size->id,
                'value' => strtolower($s),
                'display_value' => $s,
                'meta' => null,
                'sort_order' => $i,
            ]);
        }

        $material = Attribute::create([
            'name' => 'material',
            'display_name' => 'Material',
            'type' => 'select',
            'sort_order' => 3,
        ]);

        foreach (['Cotton', 'Polyester', 'Linen', 'Wool', 'Denim', 'Leather'] as $i => $m) {
            AttributeValue::create([
                'attribute_id' => $material->id,
                'value' => strtolower($m),
                'display_value' => $m,
                'meta' => null,
                'sort_order' => $i,
            ]);
        }
    }
}
