<?php

use App\Models\User;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'admin',    'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'staff',    'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'vendor',   'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);
});

// ── List + detail ─────────────────────────────────────────────────────────────

test('admin can view the user list', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)
        ->get(route('admin.users.index'))
        ->assertOk()
        ->assertInertia(fn ($p) => $p->component('Admin/Users/Index'));
});

test('admin can view a user detail page', function () {
    $admin  = User::factory()->create();
    $admin->assignRole('admin');
    $target = User::factory()->create();

    $this->actingAs($admin)
        ->get(route('admin.users.show', $target))
        ->assertOk()
        ->assertInertia(fn ($p) => $p
            ->component('Admin/Users/Show')
            ->where('user.id', $target->id)
        );
});

// ── Assign roles ──────────────────────────────────────────────────────────────

test('admin can assign a role to a user', function () {
    $admin  = User::factory()->create();
    $admin->assignRole('admin');
    $target = User::factory()->create();
    $target->assignRole('customer');

    $this->actingAs($admin)
        ->patch(route('admin.users.assign-role', $target), ['roles' => ['staff']])
        ->assertRedirect();

    expect($target->fresh()->hasRole('staff'))->toBeTrue();
    expect($target->fresh()->hasRole('customer'))->toBeFalse();
});

test('admin can strip all roles from a user', function () {
    $admin  = User::factory()->create();
    $admin->assignRole('admin');
    $target = User::factory()->create();
    $target->assignRole('staff');

    $this->actingAs($admin)
        ->patch(route('admin.users.assign-role', $target), ['roles' => []])
        ->assertRedirect();

    expect($target->fresh()->getRoleNames()->toArray())->toBeEmpty();
});

test('staff cannot access user management', function () {
    $staff  = User::factory()->create();
    $staff->assignRole('staff');
    $target = User::factory()->create();

    $this->actingAs($staff)
        ->patch(route('admin.users.assign-role', $target), ['roles' => ['vendor']])
        ->assertForbidden();
});

// ── Toggle active ─────────────────────────────────────────────────────────────

test('admin can deactivate a user', function () {
    $admin  = User::factory()->create();
    $admin->assignRole('admin');
    $target = User::factory()->create(['is_active' => true]);

    $this->actingAs($admin)
        ->patch(route('admin.users.toggle-active', $target))
        ->assertRedirect();

    expect($target->fresh()->is_active)->toBeFalse();
});

test('admin can reactivate a deactivated user', function () {
    $admin  = User::factory()->create();
    $admin->assignRole('admin');
    $target = User::factory()->create(['is_active' => false]);

    $this->actingAs($admin)
        ->patch(route('admin.users.toggle-active', $target))
        ->assertRedirect();

    expect($target->fresh()->is_active)->toBeTrue();
});

test('deactivated user is blocked from logging in', function () {
    $user = User::factory()->create([
        'is_active' => false,
        'password'  => bcrypt('secret123'),
    ]);
    $user->assignRole('customer');

    $this->post('/login', ['email' => $user->email, 'password' => 'secret123'])
        ->assertRedirect();

    $this->assertGuest();
});
