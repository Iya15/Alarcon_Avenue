<?php

namespace Database\Factories;

use App\Models\AnalyticsEvent;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<AnalyticsEvent> */
class AnalyticsEventFactory extends Factory
{
    public function definition(): array
    {
        return [
            'event_name' => fake()->randomElement([
                'product_viewed', 'add_to_cart', 'remove_from_cart',
                'checkout_started', 'order_placed', 'search_performed',
            ]),
            'user_id' => fake()->optional(0.6)->passthrough(null),
            'session_id' => fake()->uuid(),
            'subject_type' => null,
            'subject_id' => null,
            'properties' => null,
            'ip_address' => fake()->ipv4(),
            'user_agent' => fake()->userAgent(),
            'created_at' => fake()->dateTimeThisMonth(),
        ];
    }
}
