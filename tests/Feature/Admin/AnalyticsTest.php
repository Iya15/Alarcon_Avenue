<?php

use App\Models\AuditLog;
use App\Models\Coupon;
use App\Models\DailyProductStats;
use App\Models\DailySalesSummary;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Carbon;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'admin',    'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'staff',    'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);
});

// ── Aggregation correctness ───────────────────────────────────────────────────

test('AggregateAnalytics populates daily_sales_summaries with correct totals', function () {
    $today = Carbon::today()->toDateString();

    // Two paid orders today
    Order::factory()->create(['status' => 'paid', 'paid_at' => Carbon::today()->setTime(10, 0), 'total_cents' => 50000]);
    Order::factory()->create(['status' => 'paid', 'paid_at' => Carbon::today()->setTime(14, 0), 'total_cents' => 30000]);

    // Unpaid order — must NOT be counted
    Order::factory()->create(['status' => 'pending', 'paid_at' => null]);

    Artisan::call('analytics:aggregate', ['--days' => '0']);

    $summary = DailySalesSummary::where('date', $today)->first();

    expect($summary)->not->toBeNull()
        ->and($summary->orders_count)->toBe(2)
        ->and($summary->gross_cents)->toBe(80000);
});

test('AggregateAnalytics populates daily_product_stats with correct units and revenue', function () {
    $today   = Carbon::today()->toDateString();
    $product = Product::factory()->create();
    $variant = ProductVariant::factory()->for($product)->create();
    $order   = Order::factory()->create(['status' => 'paid', 'paid_at' => Carbon::today()->setTime(10, 0)]);

    OrderItem::factory()->for($order)->create([
        'product_id'         => $product->id,
        'product_variant_id' => $variant->id,
        'quantity'           => 3,
        'subtotal_cents'     => 30000,
    ]);

    Artisan::call('analytics:aggregate', ['--days' => '0']);

    $stat = DailyProductStats::where('date', $today)->where('product_id', $product->id)->first();

    expect($stat)->not->toBeNull()
        ->and($stat->units_sold)->toBe(3)
        ->and($stat->revenue_cents)->toBe(30000);
});

test('aggregation is idempotent — running twice produces one summary row', function () {
    $today = Carbon::today()->toDateString();
    Order::factory()->create(['status' => 'paid', 'paid_at' => Carbon::today()->setTime(10, 0), 'total_cents' => 20000]);

    Artisan::call('analytics:aggregate', ['--days' => '0']);
    Artisan::call('analytics:aggregate', ['--days' => '0']);

    expect(DailySalesSummary::where('date', $today)->count())->toBe(1)
        ->and(DailySalesSummary::where('date', $today)->first()->orders_count)->toBe(1);
});

test('analytics dashboard reads summary tables and returns correct widget data', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    DailySalesSummary::create([
        'date'          => now()->subDay()->toDateString(),
        'orders_count'  => 5,
        'gross_cents'   => 100000,
        'net_cents'     => 95000,
        'refunds_cents' => 5000,
        'items_sold'    => 12,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.dashboard', ['preset' => 7]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Dashboard')
            ->where('summary.total_orders', 5)
            ->where('summary.gross_cents', 100000)
        );
});

// ── Staff cannot access admin-only modules ────────────────────────────────────

test('staff cannot access user management', function () {
    $staff = User::factory()->create();
    $staff->assignRole('staff');

    $this->actingAs($staff)->get(route('admin.users.index'))->assertForbidden();
});

test('staff cannot access role management', function () {
    $staff = User::factory()->create();
    $staff->assignRole('staff');

    $this->actingAs($staff)->get(route('admin.roles.index'))->assertForbidden();
});

test('admin can access user management', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)->get(route('admin.users.index'))->assertOk();
});

test('staff can access orders and inventory', function () {
    $staff = User::factory()->create();
    $staff->assignRole('staff');

    $this->actingAs($staff)->get(route('admin.orders.index'))->assertOk();
    $this->actingAs($staff)->get(route('admin.inventory.index'))->assertOk();
});

// ── Audit log written on admin action ─────────────────────────────────────────

test('creating a product as admin writes a created audit log entry', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $category = \App\Models\Category::factory()->create();

    $this->actingAs($admin)->post(route('admin.products.store'), [
        'name'             => 'Audit Test Product',
        'slug'             => 'audit-test-product-' . rand(1000, 9999),
        'base_price_cents' => 10000,
        'status'           => 'active',
        'category_ids'     => [$category->id],
    ]);

    expect(AuditLog::where('user_id', $admin->id)->where('event', 'created')->exists())->toBeTrue();
});

test('updating a coupon as staff writes an updated audit log entry', function () {
    $staff = User::factory()->create();
    $staff->assignRole('staff');

    $coupon = Coupon::create([
        'code'           => 'STAFFEDIT',
        'discount_type'  => 'percent',
        'discount_value' => 10,
        'is_active'      => true,
        'used_count'     => 0,
    ]);

    $this->actingAs($staff)->put(route('admin.coupons.update', $coupon), [
        'code'           => 'STAFFEDIT',
        'discount_type'  => 'percent',
        'discount_value' => 10,
        'is_active'      => false,
    ]);

    expect(AuditLog::where('user_id', $staff->id)
        ->where('event', 'updated')
        ->where('auditable_id', $coupon->id)
        ->exists()
    )->toBeTrue();
});

test('unauthenticated model mutations do not produce audit log entries', function () {
    // Simply creating a product model directly (no HTTP actor) should not audit
    Product::factory()->create();

    expect(AuditLog::count())->toBe(0);
});
