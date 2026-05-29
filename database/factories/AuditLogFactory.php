<?php

namespace Database\Factories;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<AuditLog> */
class AuditLogFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'event' => fake()->randomElement(['created', 'updated', 'deleted']),
            'auditable_type' => fake()->randomElement([
                'App\\Models\\Product',
                'App\\Models\\Order',
                'App\\Models\\User',
            ]),
            'auditable_id' => fake()->numberBetween(1, 1000),
            'old_values' => null,
            'new_values' => ['status' => fake()->word()],
            'url' => fake()->url(),
            'ip_address' => fake()->ipv4(),
            'user_agent' => fake()->userAgent(),
            'created_at' => fake()->dateTimeThisMonth(),
        ];
    }
}
