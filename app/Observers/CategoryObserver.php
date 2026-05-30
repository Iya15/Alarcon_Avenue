<?php

namespace App\Observers;

use App\Models\Category;
use Illuminate\Support\Facades\Cache;

/**
 * Busts category-related caches whenever a category is created, updated, or deleted.
 * Keeps the category tree, hero section, and sitemap in sync with admin edits.
 */
class CategoryObserver
{
    public function saved(Category $category): void
    {
        $this->bust();
    }

    public function deleted(Category $category): void
    {
        $this->bust();
    }

    private function bust(): void
    {
        Cache::forget('categories.tree');
        Cache::forget('categories.hero');
        Cache::forget('homepage.featured');
        Cache::forget('homepage.bestsellers');
    }
}
