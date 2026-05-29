<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\User;

class OrderPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Order $order): bool
    {
        if ($user->hasAnyRole(['admin', 'staff'])) {
            return true;
        }

        // Vendors can view orders that contain their products
        if ($user->hasRole('vendor')) {
            return $order->items()
                ->whereHas('product', fn ($q) => $q->where('vendor_id', $user->id))
                ->exists();
        }

        return $order->user_id === $user->id
            || $order->guest_email === $user->email;
    }

    public function updateStatus(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'staff']);
    }

    public function cancel(User $user, Order $order): bool
    {
        if ($user->hasAnyRole(['admin', 'staff'])) {
            return true;
        }

        return $order->user_id === $user->id
            && in_array($order->status, ['pending', 'confirmed'], true);
    }

    public function refund(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'staff']);
    }
}
