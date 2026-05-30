<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Http\Requests\Account\StoreAddressRequest;
use App\Http\Resources\AddressResource;
use App\Models\Address;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AddressController extends Controller
{
    public function index(Request $request): Response
    {
        $addresses = $request->user()
            ->addresses()
            ->orderByDesc('is_default_shipping')
            ->orderByDesc('is_default_billing')
            ->get();

        return Inertia::render('Account/Addresses', [
            'addresses' => $addresses->map(fn ($a) => (new AddressResource($a))->resolve())->values()->all(),
        ]);
    }

    public function store(StoreAddressRequest $request): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($request, $data) {
            if ($data['is_default_shipping'] ?? false) {
                $request->user()->addresses()->update(['is_default_shipping' => false]);
            }
            if ($data['is_default_billing'] ?? false) {
                $request->user()->addresses()->update(['is_default_billing' => false]);
            }
            $request->user()->addresses()->create($data);
        });

        return back()->with('success', 'Address added.');
    }

    public function update(StoreAddressRequest $request, Address $address): RedirectResponse
    {
        if ($address->user_id !== $request->user()->id) {
            abort(403);
        }

        $data = $request->validated();

        DB::transaction(function () use ($request, $address, $data) {
            if ($data['is_default_shipping'] ?? false) {
                $request->user()->addresses()->where('id', '!=', $address->id)->update(['is_default_shipping' => false]);
            }
            if ($data['is_default_billing'] ?? false) {
                $request->user()->addresses()->where('id', '!=', $address->id)->update(['is_default_billing' => false]);
            }
            $address->update($data);
        });

        return back()->with('success', 'Address updated.');
    }

    public function destroy(Request $request, Address $address): RedirectResponse
    {
        if ($address->user_id !== $request->user()->id) {
            abort(403);
        }

        $address->delete();

        return back()->with('success', 'Address deleted.');
    }
}
