<?php

use App\Actions\Account\TrackRecentlyViewedAction;
use App\Models\Product;
use App\Models\RecentlyViewed;
use App\Models\User;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);
    $this->withHeaders(['Accept' => 'application/json']);
});

function makeProducts(int $n): array
{
    return Product::factory($n)->create([
        'status'      => 'active',
        'is_featured' => false,
        'base_price_cents' => 10000,
    ])->all();
}

// ── Tracking ──────────────────────────────────────────────────────────────────

test('viewing a product records it in recently_viewed', function () {
    $user    = User::factory()->create();
    $user->assignRole('customer');
    $product = Product::factory()->create(['status' => 'active', 'is_featured' => false, 'base_price_cents' => 100]);

    $this->actingAs($user)->post(route('api.account.recently-viewed.track'), ['product_id' => $product->id]);

    expect(RecentlyViewed::where('user_id', $user->id)->where('product_id', $product->id)->exists())->toBeTrue();
});

test('viewing the same product twice updates viewed_at without creating duplicate', function () {
    $user    = User::factory()->create();
    $user->assignRole('customer');
    $product = Product::factory()->create(['status' => 'active', 'is_featured' => false, 'base_price_cents' => 100]);

    $action = app(TrackRecentlyViewedAction::class);
    $action->execute($user, $product->id);
    $first = RecentlyViewed::where('user_id', $user->id)->where('product_id', $product->id)->value('viewed_at');

    sleep(1); // ensure timestamp changes
    $action->execute($user, $product->id);
    $second = RecentlyViewed::where('user_id', $user->id)->where('product_id', $product->id)->value('viewed_at');

    expect(RecentlyViewed::where('user_id', $user->id)->count())->toBe(1);
    expect(strtotime($second))->toBeGreaterThan(strtotime($first));
});

// ── Cap at 20 ────────────────────────────────────────────────────────────────

test('recently_viewed is capped at 20 per user', function () {
    $user     = User::factory()->create();
    $user->assignRole('customer');
    $products = makeProducts(25);

    $action = app(TrackRecentlyViewedAction::class);
    foreach ($products as $p) {
        $action->execute($user, $p->id);
    }

    expect(RecentlyViewed::where('user_id', $user->id)->count())->toBe(20);
});

test('cap prunes oldest entries, keeping the 20 most recent', function () {
    $user     = User::factory()->create();
    $user->assignRole('customer');
    $products = makeProducts(22);

    $action = app(TrackRecentlyViewedAction::class);
    foreach ($products as $p) {
        $action->execute($user, $p->id);
    }

    $remaining = RecentlyViewed::where('user_id', $user->id)
        ->orderByDesc('viewed_at')
        ->pluck('product_id')
        ->all();

    // The last 20 products (index 2..21) should be in the list
    $expectedIds = collect($products)->slice(2)->pluck('id')->all();
    sort($remaining);
    sort($expectedIds);

    expect($remaining)->toBe($expectedIds);
});

// ── Guest merge ───────────────────────────────────────────────────────────────

test('guest recently-viewed list merges into user table on login', function () {
    $user     = User::factory()->create();
    $user->assignRole('customer');
    $products = makeProducts(5);
    $ids      = collect($products)->pluck('id')->all();

    $this->actingAs($user)
        ->post(route('api.account.recently-viewed.merge'), ['ids' => $ids])
        ->assertOk();

    expect(RecentlyViewed::where('user_id', $user->id)->count())->toBe(5);
});

test('guest merge respects the 20-item cap', function () {
    $user     = User::factory()->create();
    $user->assignRole('customer');
    $existing = makeProducts(15);
    $guest    = makeProducts(10);

    $action = app(TrackRecentlyViewedAction::class);
    foreach ($existing as $p) {
        $action->execute($user, $p->id);
    }

    // Merge 10 more — total would be 25, should cap at 20
    $this->actingAs($user)
        ->post(route('api.account.recently-viewed.merge'), ['ids' => collect($guest)->pluck('id')->all()]);

    expect(RecentlyViewed::where('user_id', $user->id)->count())->toBe(20);
});

test('recently-viewed page returns 401 for JSON guests', function () {
    $this->get(route('account.recently-viewed'))->assertStatus(401);
});
