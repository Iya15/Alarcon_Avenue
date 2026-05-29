<?php

namespace App\Policies;

use App\Models\Product;
use App\Models\User;

class ProductPolicy
{
    public function viewAny(?User $user): bool
    {
        return true;
    }

    public function view(?User $user, Product $product): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['staff', 'admin', 'vendor']);
    }

    public function update(User $user, Product $product): bool
    {
        if ($user->hasAnyRole(['admin', 'staff'])) {
            return true;
        }

        return $user->hasRole('vendor') && (int) $product->vendor_id === $user->id;
    }

    public function delete(User $user, Product $product): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        if ($user->hasRole('staff') && ! $product->isVendorProduct()) {
            return true;
        }

        return $user->hasRole('vendor') && (int) $product->vendor_id === $user->id;
    }

    public function restore(User $user, Product $product): bool
    {
        return $user->hasAnyRole(['admin', 'staff']);
    }

    public function forceDelete(User $user, Product $product): bool
    {
        return $user->hasRole('admin');
    }
}
