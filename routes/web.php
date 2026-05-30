<?php

use App\Http\Controllers\Admin\AnalyticsController as AdminAnalyticsController;
use App\Http\Controllers\Admin\AttributeController as AdminAttributeController;
use App\Http\Controllers\Admin\AuditLogController as AdminAuditLogController;
use App\Http\Controllers\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Admin\CouponController as AdminCouponController;
use App\Http\Controllers\Admin\InventoryController as AdminInventoryController;
use App\Http\Controllers\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Admin\RefundController as AdminRefundController;
use App\Http\Controllers\Admin\RoleController as AdminRoleController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Admin\VariantController as AdminVariantController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\Admin\ReviewModerationController as AdminReviewModerationController;
use App\Http\Controllers\Catalog\CategoryController;
use App\Http\Controllers\Catalog\ProductController;
use App\Http\Controllers\Catalog\SearchController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\Payment\PaymentController;
use App\Http\Controllers\Payment\PayMongoWebhookController;
use App\Http\Controllers\Payment\StripeWebhookController;
use App\Http\Controllers\Account\AddressController as AccountAddressController;
use App\Http\Controllers\Account\NotificationController as AccountNotificationController;
use App\Http\Controllers\Account\OrderController as AccountOrderController;
use App\Http\Controllers\Account\ProfileController as AccountProfileController;
use App\Http\Controllers\Account\RecentlyViewedController as AccountRecentlyViewedController;
use App\Http\Controllers\Account\ReviewController as AccountReviewController;
use App\Http\Controllers\Account\WishlistController as AccountWishlistController;
use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/_styleguide', fn () => Inertia::render('Styleguide'))->name('styleguide');

// ── PUBLIC ────────────────────────────────────────────────────────────────────

Route::get('/', [HomeController::class, 'index'])->name('home');

Route::get('/products', [ProductController::class, 'index'])->name('products.index');
Route::get('/products/{slug}', [ProductController::class, 'show'])->name('products.show');
Route::get('/categories/{slug}', [CategoryController::class, 'show'])->name('categories.show');
Route::get('/search', [SearchController::class, 'index'])->name('search.index');

// ── Cart (Inertia page + JSON API — accessible to guests and auth users) ──────
Route::get('/cart', [CartController::class, 'show'])->name('cart.show');

// ── Checkout (guest + auth — no login required per access model) ──────────────
Route::get('/checkout',                                    [CheckoutController::class, 'index'])->name('checkout.index');
Route::post('/checkout',                                   [CheckoutController::class, 'store'])->name('checkout.store');
Route::get('/checkout/confirmation/{orderNumber}',         [CheckoutController::class, 'confirmation'])->name('checkout.confirmation');

// ── Payment initiation + provider return ─────────────────────────────────────
Route::post('/payment/initiate/{orderNumber}',  [PaymentController::class, 'initiate'])->name('payment.initiate');
Route::get('/payment/return/{orderNumber}',     [PaymentController::class, 'return'])->name('payment.return');

// ── User account dashboard (auth + email verified) ───────────────────────────
Route::middleware(['auth', 'verified'])
    ->prefix('account')
    ->name('account.')
    ->group(function () {
        // Profile
        Route::get('/',                  [AccountProfileController::class, 'index'])->name('profile');
        Route::post('/profile',          [AccountProfileController::class, 'update'])->name('profile.update');
        Route::post('/password',         [AccountProfileController::class, 'updatePassword'])->name('password.update');

        // Orders
        Route::get('/orders',            [AccountOrderController::class, 'index'])->name('orders.index');
        Route::get('/orders/{order}',    [AccountOrderController::class, 'show'])->name('orders.show');

        // Wishlist
        Route::get('/wishlist',          [AccountWishlistController::class, 'index'])->name('wishlist');
        Route::delete('/wishlist/{wishlistItem}', [AccountWishlistController::class, 'destroy'])->name('wishlist.destroy');

        // Addresses
        Route::get('/addresses',         [AccountAddressController::class, 'index'])->name('addresses.index');
        Route::post('/addresses',        [AccountAddressController::class, 'store'])->name('addresses.store');
        Route::put('/addresses/{address}', [AccountAddressController::class, 'update'])->name('addresses.update');
        Route::delete('/addresses/{address}', [AccountAddressController::class, 'destroy'])->name('addresses.destroy');

        // Notifications
        Route::get('/notifications',     [AccountNotificationController::class, 'index'])->name('notifications');
        Route::patch('/notifications/{id}/read', [AccountNotificationController::class, 'markRead'])->name('notifications.read');
        Route::post('/notifications/read-all', [AccountNotificationController::class, 'markAllRead'])->name('notifications.read-all');

        // Reviews
        Route::get('/reviews',           [AccountReviewController::class, 'index'])->name('reviews');
        Route::patch('/reviews/{review}', [AccountReviewController::class, 'update'])->name('reviews.update');
        Route::delete('/reviews/{review}', [AccountReviewController::class, 'destroy'])->name('reviews.destroy');

        // Recently viewed
        Route::get('/recently-viewed',   [AccountRecentlyViewedController::class, 'index'])->name('recently-viewed');
    });

// JSON endpoints for recently-viewed tracking (auth required, no verification gate)
Route::middleware('auth')->prefix('api/account')->name('api.account.')->group(function () {
    Route::post('/recently-viewed',       [AccountRecentlyViewedController::class, 'track'])->name('recently-viewed.track');
    Route::post('/recently-viewed/merge', [AccountRecentlyViewedController::class, 'mergeGuestList'])->name('recently-viewed.merge');
});

// ── Webhooks (server-to-server; CSRF excluded in bootstrap/app.php) ───────────
Route::post('/webhooks/stripe',   StripeWebhookController::class)->name('webhooks.stripe');
Route::post('/webhooks/paymongo', PayMongoWebhookController::class)->name('webhooks.paymongo');

Route::prefix('api')->name('api.')->group(function () {
    // Cart JSON API
    Route::get('/cart',                              [CartController::class, 'index'])->name('cart.index');
    Route::post('/cart/items',                       [CartController::class, 'store'])->name('cart.items.store');
    Route::patch('/cart/items/{cartItem}',           [CartController::class, 'update'])->name('cart.items.update');
    Route::delete('/cart/items/{cartItem}',          [CartController::class, 'destroy'])->name('cart.items.destroy');
    Route::patch('/cart/items/{cartItem}/save',      [CartController::class, 'saveForLater'])->name('cart.items.save');
    Route::post('/cart/coupon',                      [CartController::class, 'applyCoupon'])->name('cart.coupon.apply');
    Route::delete('/cart/coupon',                    [CartController::class, 'removeCoupon'])->name('cart.coupon.remove');
    Route::post('/cart/merge',                       [CartController::class, 'merge'])->name('cart.merge')->middleware('auth');

    // Search JSON API
    Route::get('/search/suggestions', [SearchController::class, 'suggestions'])->name('search.suggestions');
    Route::get('/search/trending',    [SearchController::class, 'trending'])->name('search.trending');
});

// ── AUTH REQUIRED ─────────────────────────────────────────────────────────────

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// ── AUTH + VERIFIED (transactional) ──────────────────────────────────────────

Route::middleware(['auth', 'verified'])->group(function () {
    // Reviews — submit (bind product by slug to match the catalog URL pattern)
    Route::post('/products/{product:slug}/reviews', [ReviewController::class, 'store'])->name('reviews.store');
});

// ── Auth required (no verification gate) — review voting ─────────────────────

Route::middleware('auth')->group(function () {
    Route::post('/reviews/{review}/vote', [ReviewController::class, 'vote'])->name('reviews.vote');
});

// ── VENDOR PANEL ─────────────────────────────────────────────────────────────

Route::middleware(['auth', 'verified', 'role:vendor|admin'])
    ->prefix('vendor')
    ->name('vendor.')
    ->group(function () {
        Route::get('/', fn () => Inertia::render('Vendor/Dashboard'))->name('dashboard');
    });

// ── STAFF + ADMIN PANEL ───────────────────────────────────────────────────────

Route::middleware(['auth', 'role:staff|admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        // Dashboard / analytics (reads pre-aggregated summary tables — eventual consistency lag up to 15 min)
        Route::get('/', [AdminAnalyticsController::class, 'dashboard'])->name('dashboard');
        Route::get('/analytics/export/sales',    [AdminAnalyticsController::class, 'exportSales'])->name('analytics.export.sales');
        Route::get('/analytics/export/products', [AdminAnalyticsController::class, 'exportProducts'])->name('analytics.export.products');

        // Categories
        Route::get('/categories', [AdminCategoryController::class, 'index'])->name('categories.index');
        Route::get('/categories/create', [AdminCategoryController::class, 'create'])->name('categories.create');
        Route::post('/categories', [AdminCategoryController::class, 'store'])->name('categories.store');
        Route::get('/categories/{category}/edit', [AdminCategoryController::class, 'edit'])->name('categories.edit');
        Route::put('/categories/{category}', [AdminCategoryController::class, 'update'])->name('categories.update');
        Route::delete('/categories/{category}', [AdminCategoryController::class, 'destroy'])->name('categories.destroy');

        // Attributes & values
        Route::get('/attributes', [AdminAttributeController::class, 'index'])->name('attributes.index');
        Route::post('/attributes', [AdminAttributeController::class, 'store'])->name('attributes.store');
        Route::put('/attributes/{attribute}', [AdminAttributeController::class, 'update'])->name('attributes.update');
        Route::delete('/attributes/{attribute}', [AdminAttributeController::class, 'destroy'])->name('attributes.destroy');
        Route::post('/attributes/{attribute}/values', [AdminAttributeController::class, 'storeValue'])->name('attribute-values.store');
        Route::put('/attribute-values/{attributeValue}', [AdminAttributeController::class, 'updateValue'])->name('attribute-values.update');
        Route::delete('/attribute-values/{attributeValue}', [AdminAttributeController::class, 'destroyValue'])->name('attribute-values.destroy');

        // Products
        Route::get('/products', [AdminProductController::class, 'index'])->name('products.index');
        Route::get('/products/create', [AdminProductController::class, 'create'])->name('products.create');
        Route::post('/products', [AdminProductController::class, 'store'])->name('products.store');
        Route::get('/products/{product}/edit', [AdminProductController::class, 'edit'])->name('products.edit');
        Route::put('/products/{product}', [AdminProductController::class, 'update'])->name('products.update');
        Route::delete('/products/{product}', [AdminProductController::class, 'destroy'])->name('products.destroy');
        Route::post('/products/{id}/restore', [AdminProductController::class, 'restore'])->name('products.restore');
        Route::delete('/products/{id}/force', [AdminProductController::class, 'forceDestroy'])->name('products.force-destroy');

        // Product images
        Route::post('/products/{product}/images', [AdminProductController::class, 'storeImage'])->name('product-images.store');
        Route::patch('/products/{product}/images/reorder', [AdminProductController::class, 'reorderImages'])->name('product-images.reorder');
        Route::delete('/product-images/{productImage}', [AdminProductController::class, 'destroyImage'])->name('product-images.destroy');
        Route::patch('/product-images/{productImage}/primary', [AdminProductController::class, 'setPrimaryImage'])->name('product-images.primary');

        // Variants + inventory
        Route::post('/products/{product}/variants', [AdminVariantController::class, 'store'])->name('variants.store');
        Route::put('/variants/{variant}', [AdminVariantController::class, 'update'])->name('variants.update');
        Route::delete('/variants/{variant}', [AdminVariantController::class, 'destroy'])->name('variants.destroy');
        Route::patch('/variants/{variant}/inventory', [AdminVariantController::class, 'updateInventory'])->name('inventory.update');

        // Refunds + transaction history
        Route::post('/orders/{order}/refund',               [AdminRefundController::class, 'store'])->name('orders.refund');
        Route::get('/orders/{order}/transactions',          [AdminRefundController::class, 'transactions'])->name('orders.transactions');

        // Review moderation queue
        Route::get('/reviews',                              [AdminReviewModerationController::class, 'index'])->name('reviews.index');
        Route::patch('/reviews/{review}',                   [AdminReviewModerationController::class, 'update'])->name('reviews.update');

        // Orders — list, detail, status transitions
        Route::get('/orders',                               [AdminOrderController::class, 'index'])->name('orders.index');
        Route::get('/orders/{order}',                       [AdminOrderController::class, 'show'])->name('orders.show');
        Route::patch('/orders/{order}/status',              [AdminOrderController::class, 'updateStatus'])->name('orders.update-status');

        // Inventory — low-stock dashboard
        Route::get('/inventory',                            [AdminInventoryController::class, 'index'])->name('inventory.index');

        // Coupons
        Route::get('/coupons',                              [AdminCouponController::class, 'index'])->name('coupons.index');
        Route::get('/coupons/create',                       [AdminCouponController::class, 'create'])->name('coupons.create');
        Route::post('/coupons',                             [AdminCouponController::class, 'store'])->name('coupons.store');
        Route::get('/coupons/{coupon}/edit',                [AdminCouponController::class, 'edit'])->name('coupons.edit');
        Route::put('/coupons/{coupon}',                     [AdminCouponController::class, 'update'])->name('coupons.update');
        Route::delete('/coupons/{coupon}',                  [AdminCouponController::class, 'destroy'])->name('coupons.destroy');

        // Audit logs (staff+admin can view, admin-only actions locked in policy)
        Route::get('/audit-logs',                           [AdminAuditLogController::class, 'index'])->name('audit-logs.index');
    });

// ── ADMIN ONLY ────────────────────────────────────────────────────────────────

// ── ADMIN ONLY (user mgmt, roles — hidden from staff) ─────────────────────────

Route::middleware(['auth', 'role:admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        // Users
        Route::get('/users',                                [AdminUserController::class, 'index'])->name('users.index');
        Route::get('/users/{user}',                         [AdminUserController::class, 'show'])->name('users.show');
        Route::patch('/users/{user}/roles',                 [AdminUserController::class, 'assignRole'])->name('users.assign-role');
        Route::patch('/users/{user}/toggle-active',         [AdminUserController::class, 'toggleActive'])->name('users.toggle-active');

        // Roles & permissions
        Route::get('/roles',                                [AdminRoleController::class, 'index'])->name('roles.index');
        Route::post('/roles',                               [AdminRoleController::class, 'store'])->name('roles.store');
        Route::put('/roles/{role}',                         [AdminRoleController::class, 'update'])->name('roles.update');
        Route::delete('/roles/{role}',                      [AdminRoleController::class, 'destroy'])->name('roles.destroy');
    });

require __DIR__.'/auth.php';
