<?php

namespace App\Http\Middleware;

use App\Models\Category;
use App\Services\CartService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'auth' => [
                'user'  => $user ? array_merge(
                    $user->only(['id', 'name', 'email', 'email_verified_at', 'phone', 'avatar_path', 'is_active', 'social_provider']),
                    ['avatar_url' => $user->avatar_path ? Storage::disk('media')->url($user->avatar_path) : null]
                ) : null,
                'roles' => $user?->getRoleNames() ?? [],
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error'   => fn () => $request->session()->get('error'),
            ],
            'cart_count'     => fn () => app(CartService::class)->getCount($request),
            // Nav categories are shared on every page so Navbar is always dynamic.
            // Cached for 1 hour; busted by CategoryObserver on any category save/delete.
            'nav_categories' => fn () => Cache::remember('categories.nav', 3600, function () {
                return Category::with(['children' => fn ($q) => $q->where('is_active', true)->orderBy('sort_order')])
                    ->whereNull('parent_id')
                    ->where('is_active', true)
                    ->where('is_nav_featured', true)
                    ->orderBy('sort_order')
                    ->get()
                    ->map(fn ($cat) => [
                        'id'        => $cat->id,
                        'name'      => $cat->name,
                        'slug'      => $cat->slug,
                        'image_url' => $cat->image_path
                            ? Storage::disk('media')->url($cat->image_path)
                            : null,
                        'children'  => $cat->children->map(fn ($c) => [
                            'id'   => $c->id,
                            'name' => $c->name,
                            'slug' => $c->slug,
                        ])->values()->all(),
                    ])
                    ->all();
            }),
        ];
    }
}
