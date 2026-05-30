<?php

namespace App\Policies;

use App\Models\Brand;
use App\Models\User;

class BrandPolicy
{
    public function viewAny(?User $user): bool { return true; }
    public function view(?User $user, Brand $brand): bool { return true; }
    public function create(User $user): bool { return $user->hasAnyRole(['staff', 'admin']); }
    public function update(User $user, Brand $brand): bool { return $user->hasAnyRole(['staff', 'admin']); }
    public function delete(User $user, Brand $brand): bool { return $user->hasAnyRole(['staff', 'admin']); }
}
