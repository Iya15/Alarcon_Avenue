<?php

namespace App\Actions\Admin\Categories;

use App\Models\Category;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UpdateCategoryAction
{
    public function execute(Category $category, array $data, ?UploadedFile $image = null): Category
    {
        if (isset($data['slug'])) {
            $data['slug'] = Str::slug($data['slug']);
        } elseif (isset($data['name']) && $data['name'] !== $category->name) {
            $data['slug'] = $this->uniqueSlug(Str::slug($data['name']), $category->id);
        }

        if ($image) {
            if ($category->image_path) {
                Storage::disk('media')->delete($category->image_path);
            }
            $data['image_path'] = $image->store('categories', 'media');
        }

        $category->update($data);

        return $category->fresh();
    }

    private function uniqueSlug(string $base, int $excludeId): string
    {
        $slug = $base;
        $i    = 1;

        while (Category::where('slug', $slug)->where('id', '!=', $excludeId)->exists()) {
            $slug = "{$base}-{$i}";
            $i++;
        }

        return $slug;
    }
}
