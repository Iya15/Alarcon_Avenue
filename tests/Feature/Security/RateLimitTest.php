<?php

use Illuminate\Support\Facades\RateLimiter;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);
    // The ThrottleRequests middleware key for guest requests is sha1(domain.'|'.ip).
    // In tests, domain is '' and ip is '127.0.0.1', so key = sha1('|127.0.0.1').
    // All throttled routes for guests share this key — clear it between tests.
    $guestKey = sha1('|127.0.0.1');
    RateLimiter::clear($guestKey);
    // Also clear the named login limiter used by AuthenticatedSessionController
    RateLimiter::clear('login|127.0.0.1');
});

// ── Login rate limiting ────────────────────────────────────────────────────────

test('login endpoint is throttled after 5 failed attempts', function () {
    foreach (range(1, 5) as $_) {
        $this->post('/login', ['email' => 'x@test.com', 'password' => 'wrong']);
    }

    $response = $this->post('/login', ['email' => 'x@test.com', 'password' => 'wrong']);

    // 6th attempt should be rate-limited (429)
    $response->assertStatus(429);
});

test('register endpoint is throttled after 10 attempts', function () {
    // Send 10 invalid register requests (wrong email format → validation 422, not redirect).
    // All share the same guest rate-limit key sha1('|127.0.0.1') which the beforeEach clears.
    foreach (range(1, 10) as $_) {
        $this->post('/register', [
            'name'                  => 'User',
            'email'                 => 'not-an-email',
            'password'              => 'pass',
            'password_confirmation' => 'pass',
        ]);
    }

    $this->post('/register', [
        'name'                  => 'User',
        'email'                 => 'not-an-email',
        'password'              => 'pass',
        'password_confirmation' => 'pass',
    ])->assertStatus(429);
});

// ── Search rate limiting ───────────────────────────────────────────────────────

test('search endpoint rate-limits at 60 per minute', function () {
    // Hit it 60 times (should all succeed)
    foreach (range(1, 60) as $_) {
        $this->get('/search?q=test');
    }

    // 61st should be throttled
    $this->get('/search?q=test')->assertStatus(429);
});

// ── Checkout rate limiting ─────────────────────────────────────────────────────

test('checkout POST is throttled after 10 attempts', function () {
    foreach (range(1, 10) as $_) {
        $this->post('/checkout', []);
    }

    $this->post('/checkout', [])->assertStatus(429);
});
