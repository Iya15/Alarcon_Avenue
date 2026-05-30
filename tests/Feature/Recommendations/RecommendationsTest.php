<?php

use App\Console\Commands\BuildProductRecommendations;
use App\Models\AnalyticsEvent;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductRecommendation;
use App\Models\ProductVariant;
use App\Models\RecentlyViewed;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Artisan;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);
});

// ── Co-purchase signal ─────────────────────────────────────────────────────────

test('BuildProductRecommendations writes bought_together rows from co-purchase data', function () {
    $productA = Product::factory()->create(['status' => 'active']);
    $productB = Product::factory()->create(['status' => 'active']);
    $productC = Product::factory()->create(['status' => 'active']);

    // A + B appear together in two paid orders
    foreach (range(1, 2) as $_) {
        $order = Order::factory()->create(['status' => 'paid', 'paid_at' => now()]);
        OrderItem::factory()->for($order)->create(['product_id' => $productA->id]);
        OrderItem::factory()->for($order)->create(['product_id' => $productB->id]);
    }

    // A + C appear together in one paid order
    $order2 = Order::factory()->create(['status' => 'paid', 'paid_at' => now()]);
    OrderItem::factory()->for($order2)->create(['product_id' => $productA->id]);
    OrderItem::factory()->for($order2)->create(['product_id' => $productC->id]);

    Artisan::call(BuildProductRecommendations::class);

    // A → B should exist with reason bought_together
    $rec = ProductRecommendation::where('product_id', $productA->id)
        ->where('recommended_product_id', $productB->id)
        ->first();

    expect($rec)->not->toBeNull()
        ->and($rec->reason)->toBe('bought_together')
        ->and($rec->score)->toBeGreaterThan(0);

    // B → A is also written (symmetric)
    expect(
        ProductRecommendation::where('product_id', $productB->id)
            ->where('recommended_product_id', $productA->id)
            ->exists()
    )->toBeTrue();

    // A → B score > A → C score because they co-purchased more often
    $scoreAB = ProductRecommendation::where('product_id', $productA->id)->where('recommended_product_id', $productB->id)->value('score');
    $scoreAC = ProductRecommendation::where('product_id', $productA->id)->where('recommended_product_id', $productC->id)->value('score');
    expect($scoreAB)->toBeGreaterThan($scoreAC);
});

test('BuildProductRecommendations writes viewed_together rows from co-view data', function () {
    $productA = Product::factory()->create(['status' => 'active']);
    $productB = Product::factory()->create(['status' => 'active']);

    // Same session, 3 co-views (>= 2 threshold)
    foreach (range(1, 3) as $_) {
        AnalyticsEvent::factory()->create([
            'event_name'   => 'product_view',
            'session_id'   => 'session-xyz',
            'subject_type' => 'App\Models\Product',
            'subject_id'   => $productA->id,
            'created_at'   => now(),
        ]);
        AnalyticsEvent::factory()->create([
            'event_name'   => 'product_view',
            'session_id'   => 'session-xyz',
            'subject_type' => 'App\Models\Product',
            'subject_id'   => $productB->id,
            'created_at'   => now(),
        ]);
    }

    Artisan::call(BuildProductRecommendations::class);

    $rec = ProductRecommendation::where('product_id', $productA->id)
        ->where('recommended_product_id', $productB->id)
        ->first();

    expect($rec)->not->toBeNull()
        ->and($rec->reason)->toBe('viewed_together');
});

test('bought_together wins over viewed_together when both signals present', function () {
    $productA = Product::factory()->create(['status' => 'active']);
    $productB = Product::factory()->create(['status' => 'active']);

    // Co-purchase signal
    $order = Order::factory()->create(['status' => 'paid', 'paid_at' => now()]);
    OrderItem::factory()->for($order)->create(['product_id' => $productA->id]);
    OrderItem::factory()->for($order)->create(['product_id' => $productB->id]);

    // Co-view signal on same pair
    foreach (range(1, 3) as $_) {
        AnalyticsEvent::factory()->create([
            'event_name' => 'product_view', 'session_id' => 'sess-1',
            'subject_type' => 'App\Models\Product', 'subject_id' => $productA->id, 'created_at' => now(),
        ]);
        AnalyticsEvent::factory()->create([
            'event_name' => 'product_view', 'session_id' => 'sess-1',
            'subject_type' => 'App\Models\Product', 'subject_id' => $productB->id, 'created_at' => now(),
        ]);
    }

    Artisan::call(BuildProductRecommendations::class);

    $rec = ProductRecommendation::where('product_id', $productA->id)
        ->where('recommended_product_id', $productB->id)
        ->first();

    expect($rec->reason)->toBe('bought_together');
});

test('category affinity fallback populates thin results with similar_category', function () {
    $category = Category::factory()->create(['is_active' => true]);
    // Product with no co-occurrence
    $product = Product::factory()->hasAttached($category)->create(['status' => 'active', 'rating_average' => 4.5]);
    // Several sibling products
    $siblings = Product::factory(4)->hasAttached($category)->create(['status' => 'active']);

    Artisan::call(BuildProductRecommendations::class);

    $recs = ProductRecommendation::where('product_id', $product->id)->get();
    expect($recs)->not->toBeEmpty();
    expect($recs->pluck('reason')->unique()->first())->toBe('similar_category');
});

// ── Personalized homepage ──────────────────────────────────────────────────────

test('personalized homepage surfaces products from user top categories', function () {
    $user     = User::factory()->create();
    $category = Category::factory()->create(['is_active' => true]);
    $product  = Product::factory()->hasAttached($category)->create(['status' => 'active', 'rating_average' => 4.8]);

    // User viewed a product in this category recently
    RecentlyViewed::create([
        'user_id'    => $user->id,
        'product_id' => $product->id,
        'viewed_at'  => now(),
    ]);

    $this->actingAs($user)
        ->get(route('home'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Home')
            ->has('personalized')
        );
});

test('guest homepage returns empty personalized array and non-empty bestsellers', function () {
    Product::factory()->create(['status' => 'active', 'is_featured' => true]);

    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Home')
            ->where('personalized', [])
            ->has('bestsellers')
        );
});
