<?php

use App\Models\User;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'staff',    'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'admin',    'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'vendor',   'guard_name' => 'web']);
});

// ── Guest access to public routes ────────────────────────────────────────────

test('guest can reach the homepage', function () {
    $this->get('/')->assertStatus(200);
});

test('guest can reach login and register pages', function () {
    $this->get('/login')->assertStatus(200);
    $this->get('/register')->assertStatus(200);
});

// ── Guest blocked from auth-required routes ───────────────────────────────────

test('guest is redirected from profile page', function () {
    $this->get('/profile')->assertRedirect('/login');
});

test('guest is redirected from vendor dashboard', function () {
    $this->get('/vendor')->assertRedirect('/login');
});

test('guest is redirected from admin dashboard', function () {
    $this->get('/admin')->assertRedirect('/login');
});

// ── Unverified customer is blocked from transactional routes ─────────────────
// The route group is middleware-guarded; the routes are stubbed in web.php
// so we test via the vendor/admin dashboards which ARE wired with real controllers.

test('unverified customer is blocked from vendor dashboard', function () {
    $user = User::factory()->unverified()->create();
    $user->assignRole('vendor');

    $this->actingAs($user)->get('/vendor')->assertRedirect(route('verification.notice'));
});

// ── Customer blocked from staff/admin areas ───────────────────────────────────

test('customer cannot access admin dashboard', function () {
    $customer = User::factory()->create();
    $customer->assignRole('customer');

    $this->actingAs($customer)->get('/admin')->assertForbidden();
});

test('customer cannot access vendor dashboard', function () {
    $customer = User::factory()->create();
    $customer->assignRole('customer');

    $this->actingAs($customer)->get('/vendor')->assertForbidden();
});

// ── Authenticated user can access own profile ─────────────────────────────────

test('authenticated user can reach their profile', function () {
    $user = User::factory()->create();
    $user->assignRole('customer');

    $this->actingAs($user)->get('/profile')->assertStatus(200);
});
