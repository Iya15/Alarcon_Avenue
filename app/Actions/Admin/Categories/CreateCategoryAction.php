<?php

namespace App\Actions\Admin\Categories;

use App\Models\Category;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CreateCategoryAction
{
    public function execute(array $data, ?UploadedFile $image = null): Category
    {
        $data['slug'] = ! empty($data['slug'] ?? null)
            ? Str::slug($data['slug'])
            : $this->uniqueSlug(Str::slug($data['name']));

        if ($image) {
            $data['image_path'] = $image->store('categories', 'media');
        }

        return Category::create($data);
    }

    private function uniqueSlug(string $base): string
    {
        $slug = $base;
        $i    = 1;

        while (Category::where('slug', $slug)->exists()) {
            $slug = "{$base}-{$i}";
            $i++;
        }

        return $slug;
    }
}
