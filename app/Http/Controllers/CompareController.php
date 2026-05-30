<?php

namespace App\Http\Controllers;

use App\Http\Resources\ProductDetailResource;
use App\Models\Attribute;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CompareController extends Controller
{
    private const MAX_PRODUCTS = 4;

    /**
     * Inertia compare page — reads IDs from query string so links are shareable.
     */
    public function index(Request $request): Response
    {
        $ids     = $this->validatedIds($request);
        $payload = $this->buildPayload($ids);

        return Inertia::render('Compare', $payload);
    }

    /**
     * JSON endpoint used by the compare store to prefetch data when the drawer opens.
     */
    public function show(Request $request): JsonResponse
    {
        $ids  = $this->validatedIds($request);
        return response()->json($this->buildPayload($ids));
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private function validatedIds(Request $request): array
    {
        $ids = array_filter(
            array_map('intval', (array) $request->input('ids', [])),
            fn ($id) => $id > 0
        );

        return array_values(array_unique(array_slice($ids, 0, self::MAX_PRODUCTS)));
    }

    private function buildPayload(array $ids): array
    {
        if (empty($ids)) {
            return ['products' => [], 'attributes' => []];
        }

        $products = Product::query()
            ->whereIn('id', $ids)
            ->where('status', 'active')
            ->with([
                'brand',
                'categories',
                'primaryImage',
                'activeVariants.inventory',
                'activeVariants.attributeValues.attribute',
            ])
            ->get()
            ->sortBy(fn ($p) => array_search($p->id, $ids))
            ->values();

        // ── Build aligned attribute map ────────────────────────────────────────
        // Collect every attribute name seen across all compared products.
        // Each product's entry lists all values it has for that attribute.

        $allAttributeNames = [];

        $productAttrs = $products->map(function ($product) use (&$allAttributeNames) {
            $attrs = [];

            foreach ($product->activeVariants as $variant) {
                foreach ($variant->attributeValues as $av) {
                    $attrName = $av->attribute?->display_name ?? $av->attribute?->name ?? 'Attribute';
                    $attrKey  = strtolower(str_replace(' ', '_', $attrName));
                    $attrs[$attrKey][] = $av->display_value ?? $av->value;
                    $allAttributeNames[$attrKey] = $attrName;
                }
            }

            // Deduplicate values within each attribute
            return array_map(fn ($vals) => array_values(array_unique($vals)), $attrs);
        });

        // Sort attributes by display name for consistent column ordering
        ksort($allAttributeNames);

        // Shape products for the frontend
        $shaped = $products->map(function ($product, $idx) use ($productAttrs, $allAttributeNames) {
            $attrs = $productAttrs[$idx];

            // Fill nulls for attributes this product does not have
            $aligned = [];
            foreach (array_keys($allAttributeNames) as $key) {
                $aligned[$key] = $attrs[$key] ?? null;
            }

            $activeVariants = $product->activeVariants;
            $lowestPrice    = $activeVariants->min('effective_price') ?? $product->base_price_cents;
            $inStock        = $activeVariants->contains(fn ($v) => ($v->inventory?->available ?? 0) > 0);

            return [
                'id'                  => $product->id,
                'name'                => $product->name,
                'slug'                => $product->slug,
                'base_price_cents'    => $product->base_price_cents,
                'lowest_price_cents'  => $lowestPrice,
                'compare_at_price_cents' => $product->compare_at_price_cents,
                'rating_average'      => $product->rating_average,
                'review_count'        => $product->review_count,
                'in_stock'            => $inStock,
                'brand'               => $product->brand?->name,
                'categories'          => $product->categories->pluck('name')->all(),
                'primary_image'       => $product->primaryImage
                    ? ['url' => \Illuminate\Support\Facades\Storage::disk('media')->url($product->primaryImage->path)]
                    : null,
                'attributes'          => $aligned,
            ];
        })->values()->all();

        return [
            'products'   => $shaped,
            // attribute_key => display_name, used to render table rows in order
            'attributes' => $allAttributeNames,
        ];
    }
}
