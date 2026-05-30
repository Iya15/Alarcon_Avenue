import Badge from '@/Components/ui/Badge';
import EmptyState from '@/Components/ui/EmptyState';
import Skeleton from '@/Components/ui/Skeleton';
import Container from '@/Components/layout/Container';
import PageLayout from '@/Components/layout/PageLayout';
import ActiveFilters from '@/Components/search/ActiveFilters';
import Filters from '@/Components/search/Filters';
import SearchInput from '@/Components/search/SearchInput';
import type { PageProps } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface Hit {
    id: number;
    name: string;
    slug: string;
    base_price_cents: number;
    lowest_variant_price_cents: number;
    compare_at_price_cents: number | null;
    has_discount: boolean;
    discount_percent: number;
    brand_name: string | null;
    in_stock: boolean;
    is_featured: boolean;
    rating_average: number | null;
    review_count: number;
    primary_image_url: string | null;
}

interface Pagination {
    page: number;
    hitsPerPage: number;
    totalHits: number;
    totalPages: number;
}

interface Facets {
    categories: { id: number; name: string; count: number }[];
    brands: { id: number; name: string; count: number }[];
    colors: Record<string, number>;
    sizes: Record<string, number>;
    materials: Record<string, number>;
    in_stock: number;
    has_discount: number;
    price_min: number;
    price_max: number;
}

interface ActiveSearchFilters {
    q?: string;
    sort?: string;
    categories?: number[];
    brand_ids?: number[];
    colors?: string[];
    sizes?: string[];
    materials?: string[];
    in_stock?: boolean;
    has_discount?: boolean;
    price_min?: number;
    price_max?: number;
    rating_min?: number;
}

interface Props extends PageProps {
    query: string;
    results: Hit[];
    pagination: Pagination;
    facets: Facets;
    filters: ActiveSearchFilters;
    brands: { id: number; name: string; slug: string }[];
    categories: { id: number; name: string; slug: string }[];
}

function formatPrice(cents: number) {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(cents / 100);
}

const sortOptions = [
    { value: 'relevance', label: 'Most relevant' },
    { value: 'price_asc', label: 'Price: Low to high' },
    { value: 'price_desc', label: 'Price: High to low' },
    { value: 'newest', label: 'Newest' },
    { value: 'rating', label: 'Top rated' },
];

function HitCard({ hit }: { hit: Hit }) {
    return (
        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
            <Link href={route('products.show', hit.slug)} className="group block">
                <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-ink-100">
                    {hit.primary_image_url ? (
                        <img
                            src={hit.primary_image_url}
                            alt={hit.name}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-ink-200">
                            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                            </svg>
                        </div>
                    )}
                    <div className="absolute left-2 top-2 flex flex-col gap-1">
                        {!hit.in_stock && <Badge variant="inverted" size="sm">Out of Stock</Badge>}
                        {hit.has_discount && (
                            <Badge variant="brand" size="sm">-{hit.discount_percent}%</Badge>
                        )}
                    </div>
                </div>

                <div className="mt-2.5 px-0.5">
                    {hit.brand_name && (
                        <p className="mb-0.5 text-xs font-medium uppercase tracking-wider text-ink-400">{hit.brand_name}</p>
                    )}
                    <p className="truncate text-sm font-medium text-ink-900 group-hover:text-brand-600">{hit.name}</p>
                    <div className="mt-0.5 flex items-baseline gap-2">
                        <span className="text-sm font-semibold text-ink-950">{formatPrice(hit.lowest_variant_price_cents)}</span>
                        {hit.compare_at_price_cents && hit.has_discount && (
                            <span className="text-xs text-ink-400 line-through">{formatPrice(hit.compare_at_price_cents)}</span>
                        )}
                    </div>
                    {hit.rating_average && (
                        <div className="mt-0.5 flex items-center gap-1">
                            <svg className="h-3 w-3 text-brand-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="text-[11px] text-ink-500">{hit.rating_average} ({hit.review_count})</span>
                        </div>
                    )}
                </div>
            </Link>
        </motion.div>
    );
}

function buildFilterBadges(filters: ActiveSearchFilters, facets: Facets): { key: string; label: string; removeUrl: string }[] {
    const badges: { key: string; label: string; removeUrl: string }[] = [];

    const buildUrl = (overrides: Partial<ActiveSearchFilters>) => {
        const merged = { ...filters, ...overrides };
        const params = new URLSearchParams();
        if (merged.q) params.set('q', merged.q);
        if (merged.sort && merged.sort !== 'relevance') params.set('sort', merged.sort);
        (merged.categories ?? []).forEach((c) => params.append('categories[]', String(c)));
        (merged.brand_ids ?? []).forEach((b) => params.append('brand_ids[]', String(b)));
        (merged.colors ?? []).forEach((c) => params.append('colors[]', c));
        (merged.sizes ?? []).forEach((s) => params.append('sizes[]', s));
        if (merged.in_stock) params.set('in_stock', '1');
        if (merged.has_discount) params.set('has_discount', '1');
        if (merged.price_min) params.set('price_min', String(merged.price_min));
        if (merged.price_max) params.set('price_max', String(merged.price_max));
        if (merged.rating_min) params.set('rating_min', String(merged.rating_min));
        return `/search?${params.toString()}`;
    };

    (filters.categories ?? []).forEach((id) => {
        const name = facets.categories.find((c) => c.id === id)?.name ?? `Category ${id}`;
        badges.push({ key: `cat-${id}`, label: name, removeUrl: buildUrl({ categories: filters.categories?.filter((c) => c !== id) }) });
    });
    (filters.brand_ids ?? []).forEach((id) => {
        const name = facets.brands.find((b) => b.id === id)?.name ?? `Brand ${id}`;
        badges.push({ key: `brand-${id}`, label: name, removeUrl: buildUrl({ brand_ids: filters.brand_ids?.filter((b) => b !== id) }) });
    });
    (filters.colors ?? []).forEach((c) => badges.push({ key: `color-${c}`, label: c, removeUrl: buildUrl({ colors: filters.colors?.filter((v) => v !== c) }) }));
    (filters.sizes ?? []).forEach((s) => badges.push({ key: `size-${s}`, label: s.toUpperCase(), removeUrl: buildUrl({ sizes: filters.sizes?.filter((v) => v !== s) }) }));
    if (filters.in_stock) badges.push({ key: 'in_stock', label: 'In Stock', removeUrl: buildUrl({ in_stock: undefined }) });
    if (filters.has_discount) badges.push({ key: 'has_discount', label: 'On Sale', removeUrl: buildUrl({ has_discount: undefined }) });
    if (filters.price_min || filters.price_max) badges.push({ key: 'price', label: `Price filtered`, removeUrl: buildUrl({ price_min: undefined, price_max: undefined }) });
    if (filters.rating_min) badges.push({ key: 'rating', label: `${filters.rating_min}★ & up`, removeUrl: buildUrl({ rating_min: undefined }) });

    return badges;
}

export default function SearchIndex({ query, results, pagination, facets, filters, brands, categories }: Props) {
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

    const handleSort = (sort: string) => {
        router.get('/search', { ...filters, sort: sort !== 'relevance' ? sort : undefined }, {
            preserveScroll: true,
            only: ['results', 'pagination', 'facets', 'filters'],
        });
    };

    const filterBadges = buildFilterBadges(filters, facets);
    const totalFilters = filterBadges.length;
    const clearAllUrl  = `/search${query ? `?q=${encodeURIComponent(query)}` : ''}`;

    return (
        <PageLayout breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Search' }]}>
            <Head title={query ? `"${query}" — Search` : 'Search'} />

            <Container className="py-6 lg:py-10">
                {/* Search bar */}
                <div className="mb-6 max-w-2xl">
                    <SearchInput
                        initialQuery={query}
                        placeholder="Search products, brands, categories…"
                    />
                </div>

                {/* Results header */}
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <p className="text-sm text-ink-500">
                            {pagination.totalHits.toLocaleString()} result{pagination.totalHits !== 1 ? 's' : ''}
                            {query && <> for <span className="font-medium text-ink-900">"{query}"</span></>}
                        </p>

                        {/* Mobile filter button */}
                        <button
                            onClick={() => setMobileFiltersOpen(true)}
                            className="flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-1.5 text-sm text-ink-700 lg:hidden"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            Filters
                            {totalFilters > 0 && (
                                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
                                    {totalFilters}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Sort */}
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-ink-500">Sort</label>
                        <select
                            value={filters.sort ?? 'relevance'}
                            onChange={(e) => handleSort(e.target.value)}
                            className="rounded-lg border border-ink-200 bg-surface px-3 py-1.5 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                            {sortOptions.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Active filter chips */}
                {filterBadges.length > 0 && (
                    <div className="mb-5">
                        <ActiveFilters filters={filterBadges} clearAllUrl={clearAllUrl} />
                    </div>
                )}

                {/* Body: sidebar + grid */}
                <div className="flex gap-8">
                    <Filters
                        facets={facets}
                        activeFilters={filters}
                        mobileOpen={mobileFiltersOpen}
                        onMobileClose={() => setMobileFiltersOpen(false)}
                    />

                    <div className="min-w-0 flex-1">
                        {results.length === 0 ? (
                            <EmptyState
                                title="No products found"
                                description={query ? `We couldn't find anything matching "${query}". Try different keywords or adjust your filters.` : 'No products match the selected filters.'}
                                action={
                                    <Link href="/search" className="text-sm font-medium text-brand-600 hover:text-brand-700">
                                        Clear all filters
                                    </Link>
                                }
                            />
                        ) : (
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
                                {results.map((hit) => (
                                    <HitCard key={hit.id} hit={hit} />
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="mt-10 flex items-center justify-center gap-1">
                                {pagination.page > 1 && (
                                    <button
                                        onClick={() => router.get('/search', { ...filters, page: pagination.page - 1 }, { preserveScroll: true, only: ['results', 'pagination', 'facets'] })}
                                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200 text-sm text-ink-700 hover:bg-ink-50"
                                    >
                                        ←
                                    </button>
                                )}
                                {Array.from({ length: Math.min(pagination.totalPages, 7) }, (_, i) => {
                                    const p = pagination.page <= 4
                                        ? i + 1
                                        : pagination.page + i - 3;
                                    if (p < 1 || p > pagination.totalPages) return null;
                                    return (
                                        <button
                                            key={p}
                                            onClick={() => router.get('/search', { ...filters, page: p }, { preserveScroll: true, only: ['results', 'pagination', 'facets'] })}
                                            className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm transition-colors ${
                                                p === pagination.page
                                                    ? 'bg-brand-500 font-semibold text-white'
                                                    : 'border border-ink-200 text-ink-700 hover:bg-ink-50'
                                            }`}
                                        >
                                            {p}
                                        </button>
                                    );
                                })}
                                {pagination.page < pagination.totalPages && (
                                    <button
                                        onClick={() => router.get('/search', { ...filters, page: pagination.page + 1 }, { preserveScroll: true, only: ['results', 'pagination', 'facets'] })}
                                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200 text-sm text-ink-700 hover:bg-ink-50"
                                    >
                                        →
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </Container>
        </PageLayout>
    );
}
