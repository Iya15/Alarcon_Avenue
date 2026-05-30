<?php

namespace Database\Seeders;

use App\Models\Brand;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class BrandSeeder extends Seeder
{
    public function run(): void
    {
        $brands = [
            ['name' => 'Alarcon Originals', 'description' => 'Our in-house label.'],
            ['name' => 'Urban Wear Co.',     'description' => 'Street-inspired everyday fashion.'],
            ['name' => 'Pacific Threads',    'description' => 'Premium quality for the modern explorer.'],
            ['name' => 'Metro Style',        'description' => 'City-ready looks for every occasion.'],
            ['name' => 'Coast & Co.',        'description' => 'Casual wear inspired by the archipelago.'],
        ];

        foreach ($brands as $i => $data) {
            Brand::create([
                'name'        => $data['name'],
                'slug'        => Str::slug($data['name']),
                'description' => $data['description'],
                'is_active'   => true,
                'sort_order'  => $i,
            ]);
        }
    }
}
