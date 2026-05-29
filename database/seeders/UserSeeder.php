<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $customerRole = Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);

        $admin = User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@alarconavenue.com',
            'is_active' => true,
        ]);
        $admin->assignRole($adminRole);

        $customer = User::factory()->create([
            'name' => 'Test Customer',
            'email' => 'customer@alarconavenue.com',
            'is_active' => true,
        ]);
        $customer->assignRole($customerRole);

        User::factory(18)->create()->each(fn ($u) => $u->assignRole($customerRole));
    }
}
