<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\ProductRecommendation;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProductRecommendationFactory extends Factory
{
    protected $model = ProductRecommendation::class;

    public function definition(): array
    {
        return [
            'product_id'             => Product::factory(),
            'recommended_product_id' => Product::factory(),
            'score'                  => $this->faker->randomFloat(2, 0.1, 20.0),
            'reason'                 => $this->faker->randomElement(['bought_together', 'viewed_together', 'similar_category']),
        ];
    }
}
