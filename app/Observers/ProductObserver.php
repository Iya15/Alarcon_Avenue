<?php

namespace App\Observers;

use App\Models\Product;
use Illuminate\Support\Facades\Cache;

/**
 * Busts product-related caches whenever a product is created, updated, or deleted.
 * Ensures the homepage and product listing reflect changes immediately.
 */
class ProductObserver
{
    public function saved(Product $product): void
    {
        $this->bust();
    }

    public function deleted(Product $product): void
    {
        $this->bust();
    }

    public function restored(Product $product): void
    {
        $this->bust();
    }

    private function bust(): void
    {
        Cache::forget('homepage.featured');
        Cache::forget('homepage.bestsellers');
    }
}
