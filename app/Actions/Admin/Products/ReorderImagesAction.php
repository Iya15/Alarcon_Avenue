<?php

namespace App\Actions\Admin\Products;

use App\Models\ProductImage;
use Illuminate\Support\Facades\DB;

class ReorderImagesAction
{
    public function execute(array $orderedIds): void
    {
        DB::transaction(function () use ($orderedIds) {
            foreach ($orderedIds as $i => $id) {
                ProductImage::where('id', $id)->update([
                    'sort_order' => $i,
                    'is_primary' => $i === 0,
                ]);
            }
        });
    }
}
