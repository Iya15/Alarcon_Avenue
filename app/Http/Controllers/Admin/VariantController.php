<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\Inventory\UpdateInventoryAction;
use App\Actions\Admin\Variants\CreateVariantAction;
use App\Actions\Admin\Variants\UpdateVariantAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreVariantRequest;
use App\Http\Requests\Admin\UpdateInventoryRequest;
use App\Http\Requests\Admin\UpdateVariantRequest;
use App\Http\Resources\ProductVariantResource;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\RedirectResponse;

class VariantController extends Controller
{
    public function store(StoreVariantRequest $request, Product $product, CreateVariantAction $action): RedirectResponse
    {
        $action->execute($product, $request->validated());

        return redirect()->route('admin.products.edit', $product)
            ->with('success', 'Variant added.');
    }

    public function update(UpdateVariantRequest $request, ProductVariant $variant, UpdateVariantAction $action): RedirectResponse
    {
        $action->execute($variant, $request->validated());

        return redirect()->route('admin.products.edit', $variant->product_id)
            ->with('success', 'Variant updated.');
    }

    public function destroy(ProductVariant $variant): RedirectResponse
    {
        $product = $variant->product;
        $this->authorize('update', $product);

        if ($product->variants()->count() <= 1) {
            return back()->withErrors(['variant' => 'A product must have at least one variant.']);
        }

        $variant->delete();

        return redirect()->route('admin.products.edit', $product)
            ->with('success', 'Variant deleted.');
    }

    public function updateInventory(UpdateInventoryRequest $request, ProductVariant $variant, UpdateInventoryAction $action): RedirectResponse
    {
        $action->execute($variant, $request->validated());

        return redirect()->route('admin.products.edit', $variant->product_id)
            ->with('success', 'Inventory updated.');
    }
}
