<?php

namespace App\Listeners;

use App\Events\StockUpdated;
use Illuminate\Support\Facades\Cache;

class ClearProductCaches
{
    public function handle(StockUpdated $event): void
    {
        Cache::forget('homepage.featured');
        Cache::forget('homepage.bestsellers');
    }
}
