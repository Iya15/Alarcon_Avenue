<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreCouponRequest;
use App\Http\Requests\Admin\UpdateCouponRequest;
use App\Models\Coupon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CouponController extends Controller
{
    public function index(Request $request): Response
    {
        $coupons = Coupon::withCount('usages')
            ->when($request->input('search'), fn ($q, $s) => $q->where('code', 'ilike', "%{$s}%"))
            ->orderByDesc('created_at')
            ->paginate(25)
            ->withQueryString()
            ->through(fn ($c) => $this->formatCoupon($c));

        return Inertia::render('Admin/Coupons/Index', ['coupons' => $coupons, 'filters' => $request->only('search')]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Coupons/CreateEdit', ['coupon' => null]);
    }

    public function store(StoreCouponRequest $request): RedirectResponse
    {
        Coupon::create($request->validated());

        return redirect()->route('admin.coupons.index')->with('success', 'Coupon created.');
    }

    public function edit(Coupon $coupon): Response
    {
        return Inertia::render('Admin/Coupons/CreateEdit', ['coupon' => $this->formatCoupon($coupon)]);
    }

    public function update(UpdateCouponRequest $request, Coupon $coupon): RedirectResponse
    {
        $coupon->update($request->validated());

        return redirect()->route('admin.coupons.index')->with('success', 'Coupon updated.');
    }

    public function destroy(Coupon $coupon): RedirectResponse
    {
        $this->authorize('delete', $coupon);
        $coupon->delete();

        return redirect()->route('admin.coupons.index')->with('success', 'Coupon deleted.');
    }

    private function formatCoupon(Coupon $c): array
    {
        return [
            'id'                 => $c->id,
            'code'               => $c->code,
            'discount_type'      => $c->discount_type,
            'discount_value'     => $c->discount_value,
            'min_order_cents'    => $c->min_order_cents,
            'max_uses'           => $c->max_uses,
            'max_uses_per_user'  => $c->max_uses_per_user,
            'used_count'         => $c->used_count,
            'usages_count'       => $c->usages_count ?? 0,
            'is_active'          => $c->is_active,
            'is_valid'           => $c->isValid(),
            'starts_at'          => $c->starts_at?->toISOString(),
            'expires_at'         => $c->expires_at?->toISOString(),
            'created_at'         => $c->created_at?->toISOString(),
        ];
    }
}
