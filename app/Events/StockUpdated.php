<?php

namespace App\Events;

use App\Models\Inventory;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Broadcast whenever a product's available stock changes.
 * Listeners: open product pages and listing pages subscribe to
 * products.{productId} and refresh their stock badge live.
 *
 * ShouldBroadcastNow skips the queue so the update arrives immediately.
 */
class StockUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $productId;
    public int $variantId;
    public int $available;
    public bool $inStock;
    public bool $isLowStock;

    public function __construct(Inventory $inventory)
    {
        $variant         = $inventory->variant;
        $this->productId = $variant->product_id;
        $this->variantId = $variant->id;
        $this->available = $inventory->available;
        $this->inStock   = $inventory->available > 0;
        $this->isLowStock = $inventory->isLowStock();
    }

    /** Public channel — no auth required to watch stock levels. */
    public function broadcastOn(): Channel
    {
        return new Channel("products.{$this->productId}");
    }

    public function broadcastAs(): string
    {
        return 'stock.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'product_id'   => $this->productId,
            'variant_id'   => $this->variantId,
            'available'    => $this->available,
            'in_stock'     => $this->inStock,
            'is_low_stock' => $this->isLowStock,
        ];
    }
}
