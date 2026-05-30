<?php

use App\Console\Commands\AggregateAnalytics;
use App\Console\Commands\BuildProductRecommendations;
use App\Console\Commands\FlagAbandonedCarts;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Rebuild today's analytics summary every 15 minutes; backfill missing historical days once per day.
Schedule::command(AggregateAnalytics::class, ['--days=0'])->everyFifteenMinutes()->withoutOverlapping();
Schedule::command(AggregateAnalytics::class, ['--days=90'])->dailyAt('01:00')->withoutOverlapping();

// Rebuild co-purchase / co-view recommendation scores nightly.
Schedule::command(BuildProductRecommendations::class)->dailyAt('02:00')->withoutOverlapping();

// Flag carts idle for more than ABANDONMENT_HOURS (default 4) as abandoned.
Schedule::command(FlagAbandonedCarts::class)->hourly()->withoutOverlapping();
