<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\Products\CreateProductAction;
use App\Actions\Admin\Products\ReorderImagesAction;
use App\Actions\Admin\Products\UpdateProductAction;
use App\Actions\Admin\Products\UploadProductImageAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ReorderImagesRequest;
use App\Http\Requests\Admin\StoreProductImageRequest;
use App\Http\Requests\Admin\StoreProductRequest;
use App\Http\Requests\Admin\UpdateProductRequest;
use App\Http\Resources\AttributeResource;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\ProductImageResource;
use App\Http\Resources\ProductResource;
use App\Models\Attribute;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        $products = Product::withTrashed()
            ->with(['primaryImage', 'categories'])
            ->withCount('variants')
            ->when($request->input('search'), fn ($q, $s) => $q->where('name', 'ilike', "%{$s}%"))
            ->when($request->input('status'), fn ($q, $s) => $q->where('status', $s))
            ->orderByDesc('created_at')
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('Admin/Products/Index', [
            'products' => ProductResource::collection($products),
            'filters'  => $request->only('search', 'status'),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Products/CreateEdit', [
            'categories' => CategoryResource::collection(Category::orderBy('name')->get()),
            'attributes' => AttributeResource::collection(Attribute::with('values')->get()),
        ]);
    }

    public function store(
        StoreProductRequest      $request,
        CreateProductAction      $action,
        UploadProductImageAction $uploadAction,
    ): RedirectResponse {
        $product = $action->execute($request->validated());

        if ($request->hasFile('images')) {
            $uploadAction->execute($product, $request->file('images'));
        }

        $message = $request->hasFile('images')
            ? 'Product created with images. Add variants below.'
            : 'Product created. Add images and variants below.';

        return redirect()->route('admin.products.edit', $product)->with('success', $message);
    }

    public function edit(Product $product): Response
    {
        $product->load(['categories', 'images', 'variants.attributeValues', 'variants.inventory']);

        return Inertia::render('Admin/Products/CreateEdit', [
            'product'    => (new ProductResource($product))->resolve(),
            'categories' => CategoryResource::collection(Category::orderBy('name')->get()),
            'attributes' => AttributeResource::collection(Attribute::with('values')->get()),
        ]);
    }

    public function update(UpdateProductRequest $request, Product $product, UpdateProductAction $action): RedirectResponse
    {
        $action->execute($product, $request->validated());

        return redirect()->route('admin.products.edit', $product)
            ->with('success', 'Product updated.');
    }

    public function destroy(Product $product): RedirectResponse
    {
        $this->authorize('delete', $product);
        $product->delete();

        return redirect()->route('admin.products.index')
            ->with('success', 'Product archived.');
    }

    public function restore(int $id): RedirectResponse
    {
        $product = Product::withTrashed()->findOrFail($id);
        $this->authorize('restore', $product);
        $product->restore();

        return redirect()->route('admin.products.edit', $product)
            ->with('success', 'Product restored.');
    }

    public function forceDestroy(int $id): RedirectResponse
    {
        $product = Product::withTrashed()->findOrFail($id);
        $this->authorize('forceDelete', $product);

        foreach ($product->images as $image) {
            Storage::disk('media')->delete($image->path);
        }

        $product->forceDelete();

        return redirect()->route('admin.products.index')
            ->with('success', 'Product permanently deleted.');
    }

    public function storeImage(StoreProductImageRequest $request, Product $product, UploadProductImageAction $action): RedirectResponse
    {
        $action->execute(
            $product,
            $request->file('images'),
            $request->integer('variant_id') ?: null,
            $request->input('alt_text'),
        );

        return back()->with('success', 'Image(s) uploaded.');
    }

    public function reorderImages(ReorderImagesRequest $request, Product $product, ReorderImagesAction $action): RedirectResponse
    {
        $action->execute($request->validated()['ordered_ids']);

        return back()->with('success', 'Images reordered.');
    }

    public function destroyImage(ProductImage $productImage): RedirectResponse
    {
        $this->authorize('update', $productImage->product);
        Storage::disk('media')->delete($productImage->path);
        $productImage->delete();

        return back()->with('success', 'Image deleted.');
    }

    public function setPrimaryImage(ProductImage $productImage): RedirectResponse
    {
        $this->authorize('update', $productImage->product);

        ProductImage::where('product_id', $productImage->product_id)->update(['is_primary' => false]);
        $productImage->update(['is_primary' => true]);

        return back()->with('success', 'Primary image set.');
    }
}
