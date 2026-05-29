<?php

use App\Models\Category;
use App\Models\User;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'admin',  'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'staff',  'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);
});

// ── Access control ────────────────────────────────────────────────────────────

test('guest cannot access admin categories', function () {
    $this->get(route('admin.categories.index'))->assertRedirect(route('login'));
});

test('customer cannot access admin categories', function () {
    $user = User::factory()->create();
    $user->assignRole('customer');
    $this->actingAs($user)->get(route('admin.categories.index'))->assertForbidden();
});

test('staff can access admin categories', function () {
    $staff = User::factory()->create();
    $staff->assignRole('staff');
    $this->actingAs($staff)->get(route('admin.categories.index'))->assertOk();
});

// ── CRUD ──────────────────────────────────────────────────────────────────────

test('staff can create a category', function () {
    $staff = User::factory()->create();
    $staff->assignRole('staff');

    $response = $this->actingAs($staff)->post(route('admin.categories.store'), [
        'name'       => 'New Category',
        'is_active'  => true,
        'sort_order' => 0,
    ]);

    $response->assertRedirect(route('admin.categories.index'));
    $this->assertDatabaseHas('categories', ['name' => 'New Category', 'slug' => 'new-category']);
});

test('slug is auto-generated from name when blank', function () {
    $staff = User::factory()->create();
    $staff->assignRole('staff');

    $this->actingAs($staff)->post(route('admin.categories.store'), [
        'name' => 'Summer Collection', 'is_active' => true, 'sort_order' => 0,
    ]);

    $this->assertDatabaseHas('categories', ['slug' => 'summer-collection']);
});

test('duplicate slug gets a numeric suffix', function () {
    Category::factory()->create(['name' => 'Electronics', 'slug' => 'electronics']);
    $staff = User::factory()->create();
    $staff->assignRole('staff');

    $this->actingAs($staff)->post(route('admin.categories.store'), [
        'name' => 'Electronics', 'is_active' => true, 'sort_order' => 0,
    ]);

    $this->assertDatabaseHas('categories', ['slug' => 'electronics-1']);
});

test('staff can update a category', function () {
    $staff    = User::factory()->create();
    $staff->assignRole('staff');
    $category = Category::factory()->create(['name' => 'Old Name', 'slug' => 'old-name']);

    $this->actingAs($staff)->put(route('admin.categories.update', $category), [
        'name' => 'New Name', 'is_active' => true, 'sort_order' => 0,
    ])->assertRedirect(route('admin.categories.index'));

    expect($category->fresh()->name)->toBe('New Name');
});

test('deleting a parent moves children to grandparent', function () {
    $staff  = User::factory()->create();
    $staff->assignRole('staff');
    $parent = Category::factory()->create(['parent_id' => null]);
    $child  = Category::factory()->create(['parent_id' => $parent->id]);

    $this->actingAs($staff)->delete(route('admin.categories.destroy', $parent));

    expect($child->fresh()->parent_id)->toBeNull();
    $this->assertDatabaseMissing('categories', ['id' => $parent->id]);
});

test('creating a category requires a name', function () {
    $staff = User::factory()->create();
    $staff->assignRole('staff');

    $this->actingAs($staff)->post(route('admin.categories.store'), [
        'is_active' => true,
    ])->assertSessionHasErrors('name');
});
