<?php

namespace App\Console\Commands;

use App\Models\Category;
use App\Models\Product;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Spatie\Sitemap\Sitemap;
use Spatie\Sitemap\Tags\Url;

/**
 * Generates an XML sitemap at public/sitemap.xml.
 * Covers: home, products (active), categories (active), and static pages.
 * Scheduled daily — see routes/console.php.
 */
class GenerateSitemap extends Command
{
    protected $signature   = 'sitemap:generate';
    protected $description = 'Regenerate the XML sitemap at public/sitemap.xml';

    public function handle(): int
    {
        $sitemap = Sitemap::create();
        $appUrl  = rtrim(config('app.url'), '/');

        // ── Static pages ───────────────────────────────────────────────────────
        $sitemap->add(
            Url::create($appUrl . '/')
                ->setChangeFrequency(Url::CHANGE_FREQUENCY_DAILY)
                ->setPriority(1.0)
        );

        $sitemap->add(
            Url::create($appUrl . '/products')
                ->setChangeFrequency(Url::CHANGE_FREQUENCY_DAILY)
                ->setPriority(0.9)
        );

        // ── Active categories ──────────────────────────────────────────────────
        Category::where('is_active', true)->orderBy('id')->each(function (Category $cat) use ($sitemap, $appUrl) {
            $sitemap->add(
                Url::create($appUrl . '/categories/' . $cat->slug)
                    ->setLastModificationDate(Carbon::parse($cat->updated_at))
                    ->setChangeFrequency(Url::CHANGE_FREQUENCY_WEEKLY)
                    ->setPriority(0.8)
            );
        });

        // ── Active products ────────────────────────────────────────────────────
        Product::where('status', 'active')->orderBy('id')->each(function (Product $product) use ($sitemap, $appUrl) {
            $sitemap->add(
                Url::create($appUrl . '/products/' . $product->slug)
                    ->setLastModificationDate(Carbon::parse($product->updated_at))
                    ->setChangeFrequency(Url::CHANGE_FREQUENCY_WEEKLY)
                    ->setPriority(0.7)
            );
        });

        $sitemap->writeToFile(public_path('sitemap.xml'));

        $this->info('Sitemap written to public/sitemap.xml');

        return self::SUCCESS;
    }
}
