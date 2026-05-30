<?php

use App\Actions\Admin\Inventory\UpdateInventoryAction;
use App\Events\StockUpdated;
use App\Models\Inventory;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Events\PaymentSucceeded;
use Illuminate\Support\Facades\Event;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
});

// ── UpdateInventoryAction fires StockUpdated ───────────────────────────────────

test('UpdateInventoryAction broadcasts StockUpdated event', function () {
    Event::fake([StockUpdated::class]);

    $product = Product::factory()->create(['status' => 'active']);
    $variant = ProductVariant::factory()->for($product)->create(['is_active' => true]);
    Inventory::factory()->create(['product_variant_id' => $variant->id, 'quantity' => 10, 'reserved_quantity' => 0]);

    (new UpdateInventoryAction())->execute($variant->fresh(), ['quantity' => 25]);

    Event::assertDispatched(StockUpdated::class, function (StockUpdated $event) use ($product, $variant) {
        return $event->productId === $product->id
            && $event->variantId === $variant->id
            && $event->available === 25;
    });
});

// ── StockUpdated event is on the correct public channel ───────────────────────

test('StockUpdated broadcasts on products.{id} public channel', function () {
    $product = Product::factory()->create(['status' => 'active']);
    $variant = ProductVariant::factory()->for($product)->create(['is_active' => true]);
    $inv     = Inventory::factory()->create([
        'product_variant_id' => $variant->id,
        'quantity'           => 5,
        'reserved_quantity'  => 0,
    ]);

    $event = new StockUpdated($inv->load('variant'));

    $channels = $event->broadcastOn();
    $channel  = is_array($channels) ? $channels[0] : $channels;

    expect($channel->name)->toBe("products.{$product->id}");
    expect($event->broadcastAs())->toBe('stock.updated');
});

test('StockUpdated payload contains correct fields', function () {
    $product = Product::factory()->create(['status' => 'active']);
    $variant = ProductVariant::factory()->for($product)->create(['is_active' => true]);
    $inv     = Inventory::factory()->create([
        'product_variant_id' => $variant->id,
        'quantity'           => 3,
        'reserved_quantity'  => 1,
        'low_stock_threshold' => 5,
    ]);

    $event   = new StockUpdated($inv->load('variant'));
    $payload = $event->broadcastWith();

    expect($payload)->toMatchArray([
        'product_id' => $product->id,
        'variant_id' => $variant->id,
        'available'  => 2,   // 3 - 1
        'in_stock'   => true,
        'is_low_stock' => true, // available(2) <= threshold(5)
    ]);
});

// ── HandlePaymentSucceeded fires StockUpdated for each order item variant ──────

test('order payment triggers StockUpdated for each affected variant', function () {
    Event::fake([StockUpdated::class]);

    $product1 = Product::factory()->create(['status' => 'active']);
    $product2 = Product::factory()->create(['status' => 'active']);
    $variant1 = ProductVariant::factory()->for($product1)->create(['is_active' => true]);
    $variant2 = ProductVariant::factory()->for($product2)->create(['is_active' => true]);
    Inventory::factory()->create(['product_variant_id' => $variant1->id, 'quantity' => 10, 'reserved_quantity' => 2]);
    Inventory::factory()->create(['product_variant_id' => $variant2->id, 'quantity' => 8, 'reserved_quantity' => 1]);

    $order   = Order::factory()->create(['status' => 'pending']);
    $payment = Payment::factory()->for($order)->create(['status' => 'pending']);
    OrderItem::factory()->for($order)->create(['product_id' => $product1->id, 'product_variant_id' => $variant1->id, 'quantity' => 2]);
    OrderItem::factory()->for($order)->create(['product_id' => $product2->id, 'product_variant_id' => $variant2->id, 'quantity' => 1]);

    event(new PaymentSucceeded($order, $payment));

    Event::assertDispatched(StockUpdated::class, 2);
});
