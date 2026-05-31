<?php

namespace App\Console\Commands;

use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;

/**
 * Run once on every deploy (or manually after a fresh setup).
 *
 * 1. Pushes index settings (filterable/sortable/searchable attributes) to Meilisearch.
 *    This is required before any filter query works — without it, "status = active" crashes.
 *
 * 2. Imports all active products into the search index.
 *    With SCOUT_QUEUE=true the import queues jobs; --process-queue flushes them inline.
 */
class SetupSearch extends Command
{
    protected $signature   = 'search:setup {--fresh : Drop and re-create the index before importing}';
    protected $description = 'Configure Meilisearch index settings and import all products';

    public function handle(): int
    {
        $this->info('Configuring Meilisearch index settings…');

        try {
            Artisan::call('scout:sync-index-settings', [], $this->output);
        } catch (\Throwable $e) {
            $this->error('sync-index-settings failed: ' . $e->getMessage());
            return self::FAILURE;
        }

        if ($this->option('fresh')) {
            $this->info('Flushing existing index…');
            try {
                Artisan::call('scout:flush', ['model' => Product::class], $this->output);
            } catch (\Throwable $e) {
                $this->warn('Flush skipped (index may not exist yet): ' . $e->getMessage());
            }
        }

        $this->info('Importing products into Meilisearch…');

        try {
            Artisan::call('scout:import', ['model' => Product::class], $this->output);
        } catch (\Throwable $e) {
            $this->error('scout:import failed: ' . $e->getMessage());
            return self::FAILURE;
        }

        // If SCOUT_QUEUE=true the import queued jobs — process them now so index is
        // immediately usable after deploy without a separate queue:work step.
        $pending = \Illuminate\Support\Facades\DB::table('jobs')
            ->where('payload', 'like', '%MakeSearchable%')
            ->count();

        if ($pending > 0) {
            $this->info("Processing {$pending} queued indexing job(s)…");
            Artisan::call('queue:work', [
                '--stop-when-empty' => true,
                '--tries'           => 1,
                '--quiet'           => true,
            ]);
        }

        $this->info('Search index ready.');
        return self::SUCCESS;
    }
}
