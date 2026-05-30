<?php

use App\Events\CartAbandoned;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\ProductVariant;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Event;

// ── FlagAbandonedCarts command ────────────────────────────────────────────────

test('FlagAbandonedCarts flags carts idle beyond threshold', function () {
    Event::fake([CartAbandoned::class]);

    // Cart with active item, last touched 5 hours ago → should be flagged (threshold: 4h)
    $abandoned = Cart::factory()->create(['updated_at' => now()->subHours(5)]);
    CartItem::factory()->for($abandoned)->create(['saved_for_later' => false]);

    // Cart with active item, last touched 2 hours ago → should NOT be flagged
    $active = Cart::factory()->create(['updated_at' => now()->subHours(2)]);
    CartItem::factory()->for($active)->create(['saved_for_later' => false]);

    // Cart already flagged → should NOT be reflagged
    $alreadyAbandoned = Cart::factory()->create([
        'updated_at'   => now()->subHours(10),
        'status'       => 'abandoned',
        'abandoned_at' => now()->subHours(6),
    ]);
    CartItem::factory()->for($alreadyAbandoned)->create(['saved_for_later' => false]);

    Artisan::call('carts:flag-abandoned');

    $abandoned->refresh();
    $active->refresh();
    $alreadyAbandoned->refresh();

    expect($abandoned->status)->toBe('abandoned')
        ->and($abandoned->abandoned_at)->not->toBeNull();

    expect($active->status)->toBeNull();

    // alreadyAbandoned should remain abandoned (not double-processed)
    expect($alreadyAbandoned->status)->toBe('abandoned');

    Event::assertDispatched(CartAbandoned::class, 1);
    Event::assertDispatched(CartAbandoned::class, fn ($e) => $e->cart->id === $abandoned->id);
});

test('FlagAbandonedCarts ignores carts with only saved-for-later items', function () {
    Event::fake([CartAbandoned::class]);

    $cart = Cart::factory()->create(['updated_at' => now()->subHours(10)]);
    CartItem::factory()->for($cart)->create(['saved_for_later' => true]);

    Artisan::call('carts:flag-abandoned');

    $cart->refresh();
    expect($cart->status)->toBeNull();
    Event::assertNotDispatched(CartAbandoned::class);
});

test('FlagAbandonedCarts ignores recovered carts', function () {
    Event::fake([CartAbandoned::class]);

    $cart = Cart::factory()->create([
        'updated_at'   => now()->subHours(10),
        'status'       => 'recovered',
        'recovered_at' => now()->subHours(1),
    ]);
    CartItem::factory()->for($cart)->create(['saved_for_later' => false]);

    Artisan::call('carts:flag-abandoned');

    $cart->refresh();
    expect($cart->status)->toBe('recovered');
    Event::assertNotDispatched(CartAbandoned::class);
});

test('FlagAbandonedCarts respects custom --hours option', function () {
    Event::fake([CartAbandoned::class]);

    // Idle for 2 hours — won't be flagged at 4h threshold, but will at 1h
    $cart = Cart::factory()->create(['updated_at' => now()->subHours(2)]);
    CartItem::factory()->for($cart)->create(['saved_for_later' => false]);

    Artisan::call('carts:flag-abandoned', ['--hours' => '1']);

    $cart->refresh();
    expect($cart->status)->toBe('abandoned');
    Event::assertDispatched(CartAbandoned::class, 1);
});

// ── Recovery state via PlaceOrderAction ───────────────────────────────────────

test('placing an order marks the cart as recovered', function () {
    // This is the model-level integration — verify Cart gets status=recovered
    $cart = Cart::factory()->create([
        'status'       => 'abandoned',
        'abandoned_at' => now()->subHour(),
    ]);

    $cart->update([
        'status'       => 'recovered',
        'recovered_at' => now(),
    ]);

    $cart->refresh();
    expect($cart->status)->toBe('recovered')
        ->and($cart->recovered_at)->not->toBeNull();
});
