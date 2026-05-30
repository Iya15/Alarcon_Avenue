<?php

namespace App\Console\Commands;

use App\Events\CartAbandoned;
use App\Models\Cart;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

/**
 * Flags carts as abandoned when they have active items but no activity for
 * ABANDONMENT_HOURS (default: env CART_ABANDONMENT_HOURS, fallback 4).
 *
 * Definition of "abandoned":
 *  - Cart has at least one non-saved-for-later item
 *  - Last updated more than N hours ago
 *  - Not already abandoned or recovered
 *
 * Definition of "recovered" (set by PlaceOrderAction):
 *  - The cart's active items were converted to an order — status = 'recovered'
 *
 * This job is scheduled hourly (see routes/console.php).
 */
class FlagAbandonedCarts extends Command
{
    protected $signature   = 'carts:flag-abandoned {--hours= : Override the inactivity threshold in hours}';
    protected $description = 'Flag carts with items that have been idle beyond the abandonment threshold';

    public function handle(): int
    {
        $hours   = (int) ($this->option('hours') ?: config('cart.abandonment_hours', env('CART_ABANDONMENT_HOURS', 4)));
        $cutoff  = Carbon::now()->subHours($hours);

        // Carts with active (non-saved-for-later) items, idle since $cutoff, not yet flagged
        $carts = Cart::whereNull('status')
            ->where('updated_at', '<=', $cutoff)
            ->whereHas('items', fn ($q) => $q->where('saved_for_later', false))
            ->with(['items', 'user'])
            ->get();

        $count = 0;
        foreach ($carts as $cart) {
            $cart->update([
                'status'       => 'abandoned',
                'abandoned_at' => now(),
            ]);

            event(new CartAbandoned($cart));
            $count++;
        }

        $this->line("Flagged {$count} cart(s) as abandoned (threshold: {$hours}h).");

        return self::SUCCESS;
    }
}
