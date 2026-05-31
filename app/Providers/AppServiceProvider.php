<?php

namespace App\Providers;

use App\Events\OrderPaid;
use App\Events\OrderPlaced;
use App\Events\PaymentFailed;
use App\Events\PaymentSucceeded;
use App\Listeners\HandlePaymentFailed;
use App\Listeners\HandlePaymentSucceeded;
use App\Listeners\SendOrderConfirmationEmail;
use App\Listeners\SendOrderPaidEmail;
use App\Models\Brand;
use App\Models\Coupon;
use App\Observers\AdminAuditObserver;
use App\Observers\CategoryObserver;
use App\Observers\ProductObserver;
use App\Observers\ReviewObserver;
use App\Policies\CouponPolicy;
use App\Services\Payment\PaymentGatewayManager;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use App\Policies\BrandPolicy;
use App\Policies\CategoryPolicy;
use App\Policies\OrderPolicy;
use App\Policies\ProductPolicy;
use App\Policies\ReviewPolicy;
use App\Policies\UserPolicy;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(PaymentGatewayManager::class);
    }

    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        Review::observe(ReviewObserver::class);
        Category::observe(CategoryObserver::class);
        Product::observe(ProductObserver::class);

        // Audit trail for admin-managed models
        foreach ([Product::class, Category::class, Order::class, Coupon::class, User::class] as $model) {
            $model::observe(AdminAuditObserver::class);
        }

        Event::listen(OrderPlaced::class,     SendOrderConfirmationEmail::class);
        Event::listen(PaymentSucceeded::class, HandlePaymentSucceeded::class);
        Event::listen(PaymentFailed::class,    HandlePaymentFailed::class);
        Event::listen(OrderPaid::class,        SendOrderPaidEmail::class);

        Gate::policy(Brand::class, BrandPolicy::class);
        Gate::policy(Category::class, CategoryPolicy::class);
        Gate::policy(Product::class, ProductPolicy::class);
        Gate::policy(Order::class, OrderPolicy::class);
        Gate::policy(Review::class, ReviewPolicy::class);
        Gate::policy(User::class, UserPolicy::class);
        Gate::policy(Coupon::class, CouponPolicy::class);
    }
}
