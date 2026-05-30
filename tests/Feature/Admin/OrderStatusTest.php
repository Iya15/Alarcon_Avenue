<?php

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\User;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'staff', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);
});

// ── Valid transitions ─────────────────────────────────────────────────────────

test('admin can transition order from paid to processing', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $order = Order::factory()->create(['status' => OrderStatus::Paid]);

    $this->actingAs($admin)
        ->patch(route('admin.orders.update-status', $order), ['status' => 'processing'])
        ->assertRedirect();

    expect($order->fresh()->status)->toBe(OrderStatus::Processing);
});

test('staff can transition order from processing to shipped', function () {
    $staff = User::factory()->create();
    $staff->assignRole('staff');

    $order = Order::factory()->create(['status' => OrderStatus::Processing]);

    $this->actingAs($staff)
        ->patch(route('admin.orders.update-status', $order), ['status' => 'shipped'])
        ->assertRedirect();

    expect($order->fresh()->status)->toBe(OrderStatus::Shipped);
});

test('admin can transition order from shipped to delivered', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $order = Order::factory()->create(['status' => OrderStatus::Shipped]);

    $this->actingAs($admin)
        ->patch(route('admin.orders.update-status', $order), ['status' => 'delivered'])
        ->assertRedirect();

    expect($order->fresh()->status)->toBe(OrderStatus::Delivered);
});

// ── Final state rejection ─────────────────────────────────────────────────────

test('admin cannot transition a delivered order', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $order = Order::factory()->create(['status' => OrderStatus::Delivered]);

    $this->actingAs($admin)
        ->patch(route('admin.orders.update-status', $order), ['status' => 'processing'])
        ->assertRedirect()
        ->assertSessionHasErrors('status');

    expect($order->fresh()->status)->toBe(OrderStatus::Delivered);
});

test('admin cannot transition a cancelled order', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $order = Order::factory()->create(['status' => OrderStatus::Cancelled]);

    $this->actingAs($admin)
        ->patch(route('admin.orders.update-status', $order), ['status' => 'paid'])
        ->assertSessionHasErrors('status');
});

// ── Authorization ─────────────────────────────────────────────────────────────

test('customer cannot update order status', function () {
    $customer = User::factory()->create();
    $customer->assignRole('customer');

    $order = Order::factory()->create(['status' => OrderStatus::Paid]);

    $this->actingAs($customer)
        ->patch(route('admin.orders.update-status', $order), ['status' => 'shipped'])
        ->assertForbidden();
});

test('status field is required', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $order = Order::factory()->create(['status' => OrderStatus::Paid]);

    $this->actingAs($admin)
        ->patch(route('admin.orders.update-status', $order), [])
        ->assertSessionHasErrors('status');
});

test('invalid status value is rejected', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $order = Order::factory()->create(['status' => OrderStatus::Paid]);

    $this->actingAs($admin)
        ->patch(route('admin.orders.update-status', $order), ['status' => 'exploded'])
        ->assertSessionHasErrors('status');
});
