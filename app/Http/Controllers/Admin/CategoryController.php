<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\Categories\CreateCategoryAction;
use App\Actions\Admin\Categories\DeleteCategoryAction;
use App\Actions\Admin\Categories\UpdateCategoryAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreCategoryRequest;
use App\Http\Requests\Admin\UpdateCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function index(): Response
    {
        $categories = Category::with('parent')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->paginate(50);

        return Inertia::render('Admin/Categories/Index', [
            'categories' => CategoryResource::collection($categories),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Categories/CreateEdit', [
            'parents' => CategoryResource::collection(
                Category::whereNull('parent_id')->orderBy('name')->get()
            ),
        ]);
    }

    public function store(StoreCategoryRequest $request, CreateCategoryAction $action): RedirectResponse
    {
        $action->execute(
            $request->safe()->except('image'),
            $request->file('image'),
        );

        return redirect()->route('admin.categories.index')
            ->with('success', 'Category created.');
    }

    public function edit(Category $category): Response
    {
        return Inertia::render('Admin/Categories/CreateEdit', [
            'category' => (new CategoryResource($category))->resolve(),
            'parents'  => CategoryResource::collection(
                Category::whereNull('parent_id')
                    ->where('id', '!=', $category->id)
                    ->orderBy('name')
                    ->get()
            ),
        ]);
    }

    public function update(UpdateCategoryRequest $request, Category $category, UpdateCategoryAction $action): RedirectResponse
    {
        $action->execute(
            $category,
            $request->safe()->except('image'),
            $request->file('image'),
        );

        return redirect()->route('admin.categories.index')
            ->with('success', 'Category updated.');
    }

    public function destroy(Category $category, DeleteCategoryAction $action): RedirectResponse
    {
        $this->authorize('delete', $category);

        $action->execute($category);

        return redirect()->route('admin.categories.index')
            ->with('success', 'Category deleted.');
    }
}
