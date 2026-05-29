<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\Attributes\CreateAttributeAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAttributeRequest;
use App\Http\Requests\Admin\StoreAttributeValueRequest;
use App\Http\Requests\Admin\UpdateAttributeRequest;
use App\Http\Requests\Admin\UpdateAttributeValueRequest;
use App\Http\Resources\AttributeResource;
use App\Models\Attribute;
use App\Models\AttributeValue;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class AttributeController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Attributes/Index', [
            'attributes' => AttributeResource::collection(
                Attribute::with('values')->orderBy('sort_order')->orderBy('name')->get()
            ),
        ]);
    }

    public function store(StoreAttributeRequest $request, CreateAttributeAction $action): RedirectResponse
    {
        $action->execute($request->validated());

        return redirect()->route('admin.attributes.index')
            ->with('success', 'Attribute created.');
    }

    public function update(UpdateAttributeRequest $request, Attribute $attribute): RedirectResponse
    {
        $attribute->update($request->validated());

        return redirect()->route('admin.attributes.index')
            ->with('success', 'Attribute updated.');
    }

    public function destroy(Attribute $attribute): RedirectResponse
    {
        $this->authorize('delete', $attribute);
        $attribute->delete();

        return redirect()->route('admin.attributes.index')
            ->with('success', 'Attribute deleted.');
    }

    public function storeValue(StoreAttributeValueRequest $request, Attribute $attribute): RedirectResponse
    {
        $attribute->values()->create($request->validated());

        return redirect()->route('admin.attributes.index')
            ->with('success', 'Value added.');
    }

    public function updateValue(UpdateAttributeValueRequest $request, AttributeValue $attributeValue): RedirectResponse
    {
        $attributeValue->update($request->validated());

        return redirect()->route('admin.attributes.index')
            ->with('success', 'Value updated.');
    }

    public function destroyValue(AttributeValue $attributeValue): RedirectResponse
    {
        $attributeValue->delete();

        return redirect()->route('admin.attributes.index')
            ->with('success', 'Value deleted.');
    }
}
