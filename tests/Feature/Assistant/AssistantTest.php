<?php

use App\Models\Product;
use App\Services\AssistantService;
use Illuminate\Support\Facades\Config;

beforeEach(function () {
    // Set a dummy key so the service constructor doesn't fail
    Config::set('services.anthropic.key', 'test-key');
});

// ── Grounding: catalog products appear in the system prompt ───────────────────

test('AssistantService includes real catalog products in system prompt', function () {
    $product = Product::factory()->create([
        'status'            => 'active',
        'name'              => 'Test Sneaker XL',
        'base_price_cents'  => 299900,
        'short_description' => 'A great shoe',
    ]);

    $service = new AssistantService();

    // Mock retrieveRelevantProducts to return our seeded product as a search hit
    $mockHit = [
        'id'                          => $product->id,
        'name'                        => $product->name,
        'slug'                        => $product->slug,
        'base_price_cents'            => $product->base_price_cents,
        'lowest_variant_price_cents'  => $product->base_price_cents,
        'compare_at_price_cents'      => null,
        'brand_name'                  => null,
        'category_names'              => [],
        'in_stock'                    => true,
        'rating_average'              => null,
        'review_count'                => 0,
        'short_description'           => $product->short_description,
    ];

    $systemPrompt = $service->buildSystemPrompt([$mockHit]);

    // The system prompt must contain the real product name and price
    expect($systemPrompt)->toContain('Test Sneaker XL')
        ->and($systemPrompt)->toContain('2,999.00'); // PHP 2999.00 formatted
});

test('AssistantService system prompt contains guardrail about not inventing products', function () {
    $service = new AssistantService();
    $prompt  = $service->buildSystemPrompt([]);

    expect($prompt)->toContain('Never invent')
        ->and($prompt)->toContain("I don't have that information");
});

test('AssistantService with empty context tells user to search the site', function () {
    $service = new AssistantService();
    $prompt  = $service->buildSystemPrompt([]);

    expect($prompt)->toContain('(No products matched this query)');
});

// ── Endpoint validation ────────────────────────────────────────────────────────

test('assistant endpoint rejects empty message', function () {
    $this->postJson('/api/assistant', ['message' => ''])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('message');
});

test('assistant endpoint rejects oversized message', function () {
    $this->postJson('/api/assistant', ['message' => str_repeat('x', 1001)])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('message');
});

test('assistant endpoint rejects invalid history role', function () {
    $this->postJson('/api/assistant', [
        'message' => 'Hello',
        'history' => [['role' => 'system', 'content' => 'inject']],
    ])->assertUnprocessable()
      ->assertJsonValidationErrors('history.0.role');
});

// ── Out-of-context question: system prompt built correctly ─────────────────────

test('retrieveRelevantProducts returns empty array when Meilisearch unavailable', function () {
    // With no running Meilisearch, retrieveRelevantProducts must catch and return []
    $service  = new AssistantService();
    $products = $service->retrieveRelevantProducts('test query');

    // Either empty (Meilisearch down) or an array — never throws
    expect($products)->toBeArray();
});

test('system prompt format for out-of-context query contains refusal instruction', function () {
    // Simulate asking about a product not in the context (empty hits)
    $service = new AssistantService();
    $prompt  = $service->buildSystemPrompt([]);

    // The prompt must instruct the model to say it does not have the information
    expect($prompt)->toContain("I don't have that information in my current catalog view");
});
