<?php

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Review;
use App\Models\ReviewVote;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'customer',  'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'admin',     'guard_name' => 'web']);

    Storage::fake('media');
});

// ── Verified purchase badge ───────────────────────────────────────────────────

test('non-buyer does not get verified_purchase badge', function () {
    $user    = User::factory()->create();
    $product = Product::factory()->create();

    // User has NO orders
    $this->actingAs($user)
        ->post(route('reviews.store', $product->slug), [
            'rating' => 4,
            'body'   => 'Nice product',
        ])
        ->assertRedirect();

    $review = Review::where('user_id', $user->id)->where('product_id', $product->id)->first();

    expect($review)->not->toBeNull()
        ->and($review->verified_purchase)->toBeFalse();
});

test('verified buyer gets verified_purchase badge', function () {
    $user    = User::factory()->create();
    $product = Product::factory()->create();
    $variant = ProductVariant::factory()->for($product)->create();

    $order = Order::factory()->for($user)->create([
        'status'  => 'paid',
        'paid_at' => now(),
    ]);
    OrderItem::factory()->for($order)->create([
        'product_id' => $product->id,
        'product_variant_id' => $variant->id,
    ]);

    $this->actingAs($user)
        ->post(route('reviews.store', $product->slug), [
            'rating' => 5,
            'body'   => 'Great!',
        ])
        ->assertRedirect();

    $review = Review::where('user_id', $user->id)->where('product_id', $product->id)->first();

    expect($review)->not->toBeNull()
        ->and($review->verified_purchase)->toBeTrue();
});

// ── Auto-approve logic ────────────────────────────────────────────────────────

test('verified buyer without photos is auto-published', function () {
    $user    = User::factory()->create();
    $product = Product::factory()->create();
    $variant = ProductVariant::factory()->for($product)->create();

    $order = Order::factory()->for($user)->create(['status' => 'paid', 'paid_at' => now()]);
    OrderItem::factory()->for($order)->create([
        'product_id' => $product->id,
        'product_variant_id' => $variant->id,
    ]);

    $this->actingAs($user)
        ->post(route('reviews.store', $product->slug), ['rating' => 5, 'body' => 'Instant publish'])
        ->assertRedirect();

    $review = Review::where('user_id', $user->id)->where('product_id', $product->id)->first();

    expect($review->status)->toBe(Review::STATUS_PUBLISHED);
});

test('verified buyer with photos goes to pending', function () {
    $user    = User::factory()->create();
    $product = Product::factory()->create();
    $variant = ProductVariant::factory()->for($product)->create();

    $order = Order::factory()->for($user)->create(['status' => 'paid', 'paid_at' => now()]);
    OrderItem::factory()->for($order)->create([
        'product_id' => $product->id,
        'product_variant_id' => $variant->id,
    ]);

    $photo = UploadedFile::fake()->create('review.jpg', 200, 'image/jpeg');

    $this->actingAs($user)
        ->post(route('reviews.store', $product->slug), [
            'rating' => 5,
            'photos' => [$photo],
        ])
        ->assertRedirect();

    $review = Review::where('user_id', $user->id)->where('product_id', $product->id)->first();

    expect($review->status)->toBe(Review::STATUS_PENDING);
});

test('non-verified buyer goes to pending', function () {
    $user    = User::factory()->create();
    $product = Product::factory()->create();

    $this->actingAs($user)
        ->post(route('reviews.store', $product->slug), ['rating' => 3, 'body' => 'Pending'])
        ->assertRedirect();

    $review = Review::where('user_id', $user->id)->where('product_id', $product->id)->first();

    expect($review->status)->toBe(Review::STATUS_PENDING);
});

test('pending review is not publicly visible', function () {
    $product = Product::factory()->create(['status' => 'active']);
    Review::factory()->for($product)->pending()->create(['body' => 'hidden body']);

    $response = $this->get(route('products.show', $product->slug));

    $response->assertOk();
    // Review is pending — it must NOT appear in the published reviews prop
    $props   = $response->original->getData()['page']['props'];
    $reviews = $props['product']['reviews'] ?? [];

    expect($reviews)->toBeEmpty();
});

// ── Rating aggregation ────────────────────────────────────────────────────────

test('rating_average and review_count only count published reviews', function () {
    $product = Product::factory()->create();

    Review::factory()->for($product)->published()->create(['rating' => 4]);
    Review::factory()->for($product)->published()->create(['rating' => 2]);
    Review::factory()->for($product)->pending()->create(['rating' => 5]);

    $product->recalculateRating();
    $product->refresh();

    expect($product->review_count)->toBe(2)
        ->and((float) $product->rating_average)->toBe(3.0);
});

test('rating recomputes when review is published via observer', function () {
    $product = Product::factory()->create();
    $review  = Review::factory()->for($product)->pending()->create(['rating' => 5]);

    expect($product->fresh()->review_count)->toBe(0);

    $review->update(['status' => Review::STATUS_PUBLISHED]);

    expect($product->fresh()->review_count)->toBe(1)
        ->and((float) $product->fresh()->rating_average)->toBe(5.0);
});

test('rating recomputes when published review is deleted', function () {
    $product = Product::factory()->create();
    $review  = Review::factory()->for($product)->published()->create(['rating' => 4]);

    $product->recalculateRating();
    expect($product->fresh()->review_count)->toBe(1);

    $review->delete();

    expect($product->fresh()->review_count)->toBe(0)
        ->and($product->fresh()->rating_average)->toBeNull();
});

// ── Helpful votes ─────────────────────────────────────────────────────────────

test('user can vote helpful only once', function () {
    $user    = User::factory()->create();
    $product = Product::factory()->create();
    $review  = Review::factory()->for($product)->published()->create(['helpful_count' => 0]);

    $this->actingAs($user)
        ->post(route('reviews.vote', $review))
        ->assertOk()
        ->assertJson(['voted' => true]);

    expect($review->fresh()->helpful_count)->toBe(1);

    // Second vote — should return voted: false and not increment
    $this->actingAs($user)
        ->post(route('reviews.vote', $review))
        ->assertOk()
        ->assertJson(['voted' => false]);

    expect($review->fresh()->helpful_count)->toBe(1);
});

test('guest cannot vote helpful', function () {
    $product = Product::factory()->create();
    $review  = Review::factory()->for($product)->published()->create();

    $this->post(route('reviews.vote', $review))->assertRedirect(route('login'));
});

// ── Admin moderation ──────────────────────────────────────────────────────────

test('admin can approve a pending review', function () {
    $admin   = User::factory()->create();
    $admin->assignRole('admin');

    $product = Product::factory()->create();
    $review  = Review::factory()->for($product)->pending()->create(['rating' => 5]);

    $this->actingAs($admin)
        ->patch(route('admin.reviews.update', $review), ['action' => 'approve'])
        ->assertRedirect();

    expect($review->fresh()->status)->toBe(Review::STATUS_PUBLISHED);
});

test('admin can reject a pending review with a reason', function () {
    $admin   = User::factory()->create();
    $admin->assignRole('admin');

    $product = Product::factory()->create();
    $review  = Review::factory()->for($product)->pending()->create();

    $this->actingAs($admin)
        ->patch(route('admin.reviews.update', $review), [
            'action' => 'reject',
            'reason' => 'Violates community guidelines.',
        ])
        ->assertRedirect();

    expect($review->fresh()->status)->toBe(Review::STATUS_REJECTED)
        ->and($review->fresh()->rejection_reason)->toBe('Violates community guidelines.');
});

test('non-admin cannot access moderation queue', function () {
    $user = User::factory()->create();
    $user->assignRole('customer');

    $this->actingAs($user)
        ->get(route('admin.reviews.index'))
        ->assertForbidden();
});
