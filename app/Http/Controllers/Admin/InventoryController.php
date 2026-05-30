<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Inventory;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InventoryController extends Controller
{
    public function index(Request $request): Response
    {
        $variants = ProductVariant::with(['product:id,name,slug', 'inventory'])
            ->when($request->input('low_stock'), fn ($q) =>
                $q->whereHas('inventory', fn ($i) => $i->whereRaw('(quantity - reserved_quantity) <= low_stock_threshold'))
            )
            ->when($request->input('search'), fn ($q, $s) =>
                $q->where('sku', 'ilike', "%{$s}%")
                  ->orWhereHas('product', fn ($p) => $p->where('name', 'ilike', "%{$s}%"))
            )
            ->where('is_active', true)
            ->orderBy('sku')
            ->paginate(50)
            ->withQueryString()
            ->through(fn ($v) => [
                'id'             => $v->id,
                'sku'            => $v->sku,
                'product_id'     => $v->product_id,
                'product_name'   => $v->product?->name,
                'product_slug'   => $v->product?->slug,
                'quantity'       => $v->inventory?->quantity ?? 0,
                'reserved'       => $v->inventory?->reserved_quantity ?? 0,
                'available'      => $v->inventory?->available ?? 0,
                'is_low_stock'   => $v->inventory?->is_low_stock ?? false,
                'threshold'      => $v->inventory?->low_stock_threshold ?? 5,
            ]);

        $lowStockCount = ProductVariant::whereHas('inventory', fn ($i) =>
            $i->whereRaw('(quantity - reserved_quantity) <= low_stock_threshold')
        )->count();

        return Inertia::render('Admin/Inventory/Index', [
            'variants'      => $variants,
            'filters'       => $request->only('low_stock', 'search'),
            'low_stock_count' => $lowStockCount,
        ]);
    }
}
