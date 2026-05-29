<?php

use App\Http\Controllers\Admin\AttributeController as AdminAttributeController;
use App\Http\Controllers\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Admin\VariantController as AdminVariantController;
use App\Http\Controllers\Catalog\CategoryController;
use App\Http\Controllers\Catalog\ProductController;
use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/_styleguide', fn () => Inertia::render('Styleguide'))->name('styleguide');

// ── PUBLIC ────────────────────────────────────────────────────────────────────

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin'       => Route::has('login'),
        'canRegister'    => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion'     => PHP_VERSION,
    ]);
})->name('home');

Route::get('/products', [ProductController::class, 'index'])->name('products.index');
Route::get('/products/{slug}', [ProductController::class, 'show'])->name('products.show');
Route::get('/categories/{slug}', [CategoryController::class, 'show'])->name('categories.show');

// ── AUTH REQUIRED ─────────────────────────────────────────────────────────────

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// ── AUTH + VERIFIED (transactional) ──────────────────────────────────────────

Route::middleware(['auth', 'verified'])->group(function () {
    // Checkout — Milestone 5
    // Reviews — Milestone 5
});

// ── VENDOR PANEL ─────────────────────────────────────────────────────────────

Route::middleware(['auth', 'verified', 'role:vendor|admin'])
    ->prefix('vendor')
    ->name('vendor.')
    ->group(function () {
        Route::get('/', fn () => Inertia::render('Vendor/Dashboard'))->name('dashboard');
    });

// ── STAFF + ADMIN PANEL ───────────────────────────────────────────────────────

Route::middleware(['auth', 'role:staff|admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('/', fn () => Inertia::render('Admin/Dashboard'))->name('dashboard');

        // Categories
        Route::get('/categories', [AdminCategoryController::class, 'index'])->name('categories.index');
        Route::get('/categories/create', [AdminCategoryController::class, 'create'])->name('categories.create');
        Route::post('/categories', [AdminCategoryController::class, 'store'])->name('categories.store');
        Route::get('/categories/{category}/edit', [AdminCategoryController::class, 'edit'])->name('categories.edit');
        Route::put('/categories/{category}', [AdminCategoryController::class, 'update'])->name('categories.update');
        Route::delete('/categories/{category}', [AdminCategoryController::class, 'destroy'])->name('categories.destroy');

        // Attributes & values
        Route::get('/attributes', [AdminAttributeController::class, 'index'])->name('attributes.index');
        Route::post('/attributes', [AdminAttributeController::class, 'store'])->name('attributes.store');
        Route::put('/attributes/{attribute}', [AdminAttributeController::class, 'update'])->name('attributes.update');
        Route::delete('/attributes/{attribute}', [AdminAttributeController::class, 'destroy'])->name('attributes.destroy');
        Route::post('/attributes/{attribute}/values', [AdminAttributeController::class, 'storeValue'])->name('attribute-values.store');
        Route::put('/attribute-values/{attributeValue}', [AdminAttributeController::class, 'updateValue'])->name('attribute-values.update');
        Route::delete('/attribute-values/{attributeValue}', [AdminAttributeController::class, 'destroyValue'])->name('attribute-values.destroy');

        // Products
        Route::get('/products', [AdminProductController::class, 'index'])->name('products.index');
        Route::get('/products/create', [AdminProductController::class, 'create'])->name('products.create');
        Route::post('/products', [AdminProductController::class, 'store'])->name('products.store');
        Route::get('/products/{product}/edit', [AdminProductController::class, 'edit'])->name('products.edit');
        Route::put('/products/{product}', [AdminProductController::class, 'update'])->name('products.update');
        Route::delete('/products/{product}', [AdminProductController::class, 'destroy'])->name('products.destroy');
        Route::post('/products/{id}/restore', [AdminProductController::class, 'restore'])->name('products.restore');
        Route::delete('/products/{id}/force', [AdminProductController::class, 'forceDestroy'])->name('products.force-destroy');

        // Product images
        Route::post('/products/{product}/images', [AdminProductController::class, 'storeImage'])->name('product-images.store');
        Route::patch('/products/{product}/images/reorder', [AdminProductController::class, 'reorderImages'])->name('product-images.reorder');
        Route::delete('/product-images/{productImage}', [AdminProductController::class, 'destroyImage'])->name('product-images.destroy');
        Route::patch('/product-images/{productImage}/primary', [AdminProductController::class, 'setPrimaryImage'])->name('product-images.primary');

        // Variants + inventory
        Route::post('/products/{product}/variants', [AdminVariantController::class, 'store'])->name('variants.store');
        Route::put('/variants/{variant}', [AdminVariantController::class, 'update'])->name('variants.update');
        Route::delete('/variants/{variant}', [AdminVariantController::class, 'destroy'])->name('variants.destroy');
        Route::patch('/variants/{variant}/inventory', [AdminVariantController::class, 'updateInventory'])->name('inventory.update');
    });

// ── ADMIN ONLY ────────────────────────────────────────────────────────────────

Route::middleware(['auth', 'role:admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        // User management — Milestone 6
    });

require __DIR__.'/auth.php';
