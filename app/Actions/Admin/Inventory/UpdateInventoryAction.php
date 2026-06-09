<?php

namespace App\Actions\Admin\Inventory;

use App\Events\StockUpdated;
use App\Models\Inventory;
use App\Models\ProductVariant;

class UpdateInventoryAction
{
    public function execute(ProductVariant $variant, array $data): Inventory
    {
        $inventory = $variant->inventory
            ?? Inventory::create(['product_variant_id' => $variant->id, 'quantity' => 0, 'reserved_quantity' => 0]);

        $inventory->update([
            'quantity'            => $data['quantity'],
            'low_stock_threshold' => $data['low_stock_threshold'] ?? $inventory->low_stock_threshold,
        ]);

        $fresh = $inventory->fresh()->load('variant');

        // Broadcast updated stock so open product pages refresh live.
        // Silently skip if Reverb is not running.
        try {
            event(new StockUpdated($fresh));
        } catch (\Illuminate\Broadcasting\BroadcastException) {
            // Reverb not running — inventory is still saved, live push just won't fire.
        }

        return $fresh;
    }
}
