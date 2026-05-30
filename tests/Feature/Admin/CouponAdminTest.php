<?php

use App\Models\Coupon;
use App\Models\User;
use Illuminate\Support\Carbon;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'staff', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);
});

// ── List ──────────────────────────────────────────────────────────────────────

test('admin can view the coupon list', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Coupon::factory()->create(['code' => 'VISIBLE10']);

    $this->actingAs($admin)
        ->get(route('admin.coupons.index'))
        ->assertOk()
        ->assertInertia(fn ($p) => $p->component('Admin/Coupons/Index'));
});

// ── Create ────────────────────────────────────────────────────────────────────

test('admin can create a percent coupon', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)
        ->post(route('admin.coupons.store'), [
            'code'              => 'SAVE15',
            'discount_type'     => 'percent',
            'discount_value'    => 15,
            'min_order_cents'   => null,
            'max_uses'          => 100,
            'max_uses_per_user' => 1,
            'is_active'         => true,
            'starts_at'         => null,
            'expires_at'        => null,
        ])
        ->assertRedirect(route('admin.coupons.index'));

    $this->assertDatabaseHas('coupons', ['code' => 'SAVE15', 'discount_value' => 15]);
});

test('admin can create a fixed-amount coupon', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)
        ->post(route('admin.coupons.store'), [
            'code'           => 'FLAT500',
            'discount_type'  => 'fixed',
            'discount_value' => 50000,  // ₱500.00 in cents
            'is_active'      => true,
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('coupons', ['code' => 'FLAT500', 'discount_value' => 50000]);
});

test('duplicate coupon code is rejected', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Coupon::factory()->create(['code' => 'DUPE']);

    $this->actingAs($admin)
        ->post(route('admin.coupons.store'), [
            'code'           => 'DUPE',
            'discount_type'  => 'percent',
            'discount_value' => 10,
        ])
        ->assertSessionHasErrors('code');
});

test('expires_at must be after starts_at', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)
        ->post(route('admin.coupons.store'), [
            'code'           => 'BADDATE',
            'discount_type'  => 'percent',
            'discount_value' => 10,
            'starts_at'      => Carbon::today()->toDateString(),
            'expires_at'     => Carbon::yesterday()->toDateString(),
        ])
        ->assertSessionHasErrors('expires_at');
});

// ── Update ────────────────────────────────────────────────────────────────────

test('admin can update an existing coupon', function () {
    $admin  = User::factory()->create();
    $admin->assignRole('admin');
    $coupon = Coupon::factory()->create(['code' => 'OLD10', 'discount_value' => 10]);

    $this->actingAs($admin)
        ->put(route('admin.coupons.update', $coupon), [
            'code'           => 'OLD10',
            'discount_type'  => 'percent',
            'discount_value' => 20,
            'is_active'      => true,
        ])
        ->assertRedirect(route('admin.coupons.index'));

    expect($coupon->fresh()->discount_value)->toBe(20);
});

// ── Delete ────────────────────────────────────────────────────────────────────

test('admin can delete a coupon', function () {
    $admin  = User::factory()->create();
    $admin->assignRole('admin');
    $coupon = Coupon::factory()->create();

    $this->actingAs($admin)
        ->delete(route('admin.coupons.destroy', $coupon))
        ->assertRedirect();

    $this->assertDatabaseMissing('coupons', ['id' => $coupon->id]);
});

test('customer cannot create a coupon', function () {
    $customer = User::factory()->create();
    $customer->assignRole('customer');

    $this->actingAs($customer)
        ->post(route('admin.coupons.store'), [
            'code'           => 'HACK',
            'discount_type'  => 'percent',
            'discount_value' => 100,
        ])
        ->assertForbidden();
});
