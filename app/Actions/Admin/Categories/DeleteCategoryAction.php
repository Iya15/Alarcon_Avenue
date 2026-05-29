<?php

namespace App\Actions\Admin\Categories;

use App\Models\Category;
use Illuminate\Support\Facades\Storage;

class DeleteCategoryAction
{
    public function execute(Category $category): void
    {
        if ($category->children()->exists()) {
            // Orphaned children move up to the deleted category's parent (or root if parent was null).
            // Must use DB update directly — Eloquent skips null assignments in some builds.
            \Illuminate\Support\Facades\DB::table('categories')
                ->where('parent_id', $category->id)
                ->update(['parent_id' => $category->parent_id]);
        }

        if ($category->image_path) {
            Storage::disk('media')->delete($category->image_path);
        }

        $category->delete();
    }
}
