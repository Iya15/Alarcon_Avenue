<?php

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Payment;
use App\Models\User;
use App\Services\Payment\PaymentGatewayManager;
use App\Services\Payment\Contracts\GatewayResult;
use Illuminate\Support\Facades\App;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'staff', 'guard_name' => 'web']);
});

// ── Refund amount validation ──────────────────────────────────────────────────

test('refund amount exceeding order total is rejected', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $order   = Order::factory()->create(['status' => OrderStatus::Paid, 'total_cents' => 100000]);
    $payment = Payment::factory()->for($order)->create([
        'type'        => 'charge',
        'status'      => 'captured',
        'amount_cents' => 100000,
    ]);

    $this->actingAs($admin)
        ->post(route('admin.orders.refund', $order), [
            'amount_cents' => 200000, // exceeds total
            'reason'       => 'test',
        ])
        ->assertRedirect()
        ->assertSessionHasErrors('amount_cents');

    // Order status must remain unchanged
    expect($order->fresh()->status)->toBe(OrderStatus::Paid);
});

test('refund amount exceeding remaining refundable amount is rejected after partial refund', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $order   = Order::factory()->create(['status' => OrderStatus::PartiallyRefunded, 'total_cents' => 100000]);
    Payment::factory()->for($order)->create([
        'type'        => 'charge',
        'status'      => 'captured',
        'amount_cents' => 100000,
    ]);

    // Simulate an existing partial refund of ₱800
    \App\Models\Refund::factory()->for($order)->create(['total_cents' => 80000]);

    // Remaining refundable = 100000 - 80000 = 20000. Requesting 30000 should fail.
    $this->actingAs($admin)
        ->post(route('admin.orders.refund', $order), [
            'amount_cents' => 30000,
            'reason'       => 'extra',
        ])
        ->assertRedirect()
        ->assertSessionHasErrors('amount_cents');
});

test('refund amount of zero is rejected by validation', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $order = Order::factory()->create(['status' => OrderStatus::Paid, 'total_cents' => 50000]);

    $this->actingAs($admin)
        ->post(route('admin.orders.refund', $order), [
            'amount_cents' => 0,
        ])
        ->assertSessionHasErrors('amount_cents');
});

test('refund requires a captured payment to exist', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    // Order with only a pending payment, not captured
    $order = Order::factory()->create(['status' => OrderStatus::Paid, 'total_cents' => 50000]);
    Payment::factory()->for($order)->create(['type' => 'charge', 'status' => 'pending', 'amount_cents' => 50000]);

    $this->actingAs($admin)
        ->post(route('admin.orders.refund', $order), [
            'amount_cents' => 1000,
            'reason'       => 'test',
        ])
        ->assertRedirect()
        ->assertSessionHasErrors('refund');
});

// ── Authorization ─────────────────────────────────────────────────────────────

test('customer cannot issue a refund', function () {
    Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);

    $customer = User::factory()->create();
    $customer->assignRole('customer');

    $order = Order::factory()->create(['status' => OrderStatus::Paid, 'total_cents' => 50000]);

    $this->actingAs($customer)
        ->post(route('admin.orders.refund', $order), [
            'amount_cents' => 1000,
        ])
        ->assertForbidden();
});
