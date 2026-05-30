<?php

namespace App\Http\Controllers;

use App\Actions\GetPersonalizedHomepageAction;
use App\Http\Resources\ProductCardResource;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(Request $request, GetPersonalizedHomepageAction $action): Response
    {
        $user = $request->user();
        $data = $action->execute($user);

        $heroCategories = Category::with('children')
            ->whereNull('parent_id')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->limit(6)
            ->get();

        return Inertia::render('Home', [
            'featured'      => ProductCardResource::collection($data['featured'])->resolve(),
            'bestsellers'   => ProductCardResource::collection($data['bestsellers'])->resolve(),
            'personalized'  => ProductCardResource::collection($data['personalized'])->resolve(),
            'topCategories' => CategoryResource::collection($data['top_categories'])->resolve(),
            'heroCategories' => CategoryResource::collection($heroCategories)->resolve(),
        ]);
    }
}
