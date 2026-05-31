import Badge from '@/Components/ui/Badge';
import EmptyState from '@/Components/ui/EmptyState';
import Skeleton from '@/Components/ui/Skeleton';
import Container from '@/Components/layout/Container';
import PageLayout from '@/Components/layout/PageLayout';
import SeoHead from '@/Components/layout/SeoHead';
import type { PageProps } from '@/types';
import { Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface ProductImage { url: string; alt_text: string | null }
interface ProductCard {
    id: number; name: string; slug: string;
    base_price_cents: number; compare_at_price_cents: number | null;
    lowest_price_cents: number; in_stock: boolean; is_featured: boolean;
    primary_image: ProductImage | null;
    categories?: string[];
}
interface Category { id: number; name: string; slug: string; children?: Category[] }

// LengthAwarePaginator flat structure produced by ->through()->toArray()
interface PageLink { url: string | null; label: string; active: boolean }
interface PaginatedProducts {
    data: ProductCard[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
    links: PageLink[];
}

interface Props extends PageProps {
    products: PaginatedProducts;
    categories: Category[];
    category?: {
        id: number; name: string; slug: string;
        description: string | null; image_url: string | null;
        parent?: { name: string; slug: string } | null;
    };
    filters: { sort?: string };
    title: string;
}

function formatPrice(cents: number) {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(cents / 100);
}

function ProductCardSkeleton() {
    return (
        <div className="rounded-xl border border-ink-200 overflow-hidden">
            <Skeleton height={260} className="rounded-none" />
            <div className="p-4 space-y-2">
                <Skeleton height="0.875rem" width="70%" />
                <Skeleton height="0.75rem" width="40%" />
            </div>
        </div>
    );
}

function ProductCardItem({ product }: { product: ProductCard }) {
    return (
        <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}>
            <Link href={route('products.show', product.slug)} className="group block">
                <div className="relative overflow-hidden rounded-xl bg-ink-100">
                    <div className="aspect-[4/5]">
                        {product.primary_image?.url ? (
                            <img
                                src={product.primary_image.url}
                                alt={product.primary_image.alt_text ?? product.name}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                loading="lazy"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-ink-300">
                                <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                </svg>
                            </div>
                        )}
                    </div>

                    <div className="absolute left-2 top-2 flex flex-col gap-1">
                        {!product.in_stock && (
                            <Badge variant="inverted" size="sm">Out of Stock</Badge>
                        )}
                        {product.compare_at_price_cents && product.compare_at_price_cents > product.base_price_cents && (
                            <Badge variant="brand" size="sm">
                                -{Math.round((1 - product.base_price_cents / product.compare_at_price_cents) * 100)}%
                            </Badge>
                        )}
                    </div>
                </div>

                <div className="mt-3 px-0.5">
                    <p className="truncate text-sm font-medium text-ink-900 group-hover:text-brand-600">
                        {product.name}
                    </p>
                    <div className="mt-0.5 flex items-baseline gap-2">
                        <span className="text-sm font-semibold text-ink-950">
                            {formatPrice(product.lowest_price_cents)}
                        </span>
                        {product.compare_at_price_cents && product.compare_at_price_cents > product.base_price_cents && (
                            <span className="text-xs text-ink-400 line-through">
                                {formatPrice(product.compare_at_price_cents)}
                            </span>
                        )}
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

const sortOptions = [
    { value: 'newest',     label: 'Newest' },
    { value: 'price_asc',  label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'featured',   label: 'Featured' },
];

export default function ProductsIndex({ products, categories, category, filters, title }: Props) {
    const [sort, setSort]               = useState(filters?.sort ?? 'newest');
    const [allProducts, setAllProducts] = useState<ProductCard[]>(products.data ?? []);
    const [loadingMore, setLoadingMore] = useState(false);
    const sentinelRef = useRef<HTMLDivElement>(null);

    // Reset list when a new first-page visit arrives (sort/filter change)
    useEffect(() => {
        if (products.current_page === 1) {
            setAllProducts(products.data ?? []);
        }
    }, [products.current_page, products.data]);

    // Infinite scroll: append next page when sentinel enters viewport
    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel || products.current_page >= products.last_page) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting || loadingMore) return;
                setLoadingMore(true);
                router.get(
                    window.location.pathname,
                    { ...Object.fromEntries(new URLSearchParams(window.location.search)), page: products.current_page + 1 },
                    {
                        preserveScroll: true,
                        preserveState: true,
                        only: ['products'],
                        onSuccess: (page) => {
                            const next = (page.props as unknown as Props).products;
                            setAllProducts((prev) => {
                                const seen = new Set(prev.map((p) => p.id));
                                return [...prev, ...(next.data ?? []).filter((p) => !seen.has(p.id))];
                            });
                            setLoadingMore(false);
                        },
                        onError: () => setLoadingMore(false),
                    }
                );
            },
            { rootMargin: '300px' }
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [products.current_page, products.last_page, loadingMore]);

    const handleSort = (value: string) => {
        setSort(value);
        setAllProducts([]);
        router.get(window.location.pathname, { sort: value }, { preserveScroll: false, preserveState: false });
    };

    const breadcrumbs = category
        ? [
            { label: 'Home', href: route('home') },
            ...(category.parent ? [{ label: category.parent.name, href: route('categories.show', category.parent.slug) }] : []),
            { label: category.name },
          ]
        : [{ label: 'Home', href: route('home') }, { label: 'Products' }];

    return (
        <PageLayout breadcrumbs={breadcrumbs}>
            <SeoHead
                title={title}
                description={category?.description ?? `Browse ${title} at Alarcon Avenue — quality products, great prices.`}
                image={category?.image_url ?? undefined}
            />

            <Container className="py-8 lg:py-12">
                {/* Category header */}
                {category && (
                    <div className="mb-8">
                        {category.image_url && (
                            <div className="mb-6 overflow-hidden rounded-2xl">
                                <img src={category.image_url} alt={category.name} className="h-48 w-full object-cover lg:h-64" />
                            </div>
                        )}
                        <h1 className="text-3xl font-bold tracking-tight text-ink-950 lg:text-4xl">{category.name}</h1>
                        {category.description && (
                            <p className="mt-2 text-base text-ink-500">{category.description}</p>
                        )}
                    </div>
                )}

                {!category && (
                    <h1 className="mb-8 text-3xl font-bold tracking-tight text-ink-950 lg:text-4xl">{title}</h1>
                )}

                {/* Sort bar */}
                <div className="mb-6 flex items-center justify-between gap-4 border-b border-ink-200 pb-4">
                    <p className="text-sm text-ink-500">
                        {(products.total ?? 0).toLocaleString()} product{products.total !== 1 ? 's' : ''}
                    </p>
                    <div className="flex items-center gap-2">
                        <label htmlFor="sort" className="text-sm text-ink-500">Sort</label>
                        <select
                            id="sort"
                            value={sort}
                            onChange={(e) => handleSort(e.target.value)}
                            className="rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand"
                        >
                            {sortOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Product grid */}
                {allProducts.length === 0 && !loadingMore ? (
                    <EmptyState
                        title="No products found"
                        description="Try a different category or check back later."
                    />
                ) : (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {allProducts.map((product) => (
                            <ProductCardItem key={product.id} product={product} />
                        ))}
                    </div>
                )}

                {/* Infinite scroll sentinel */}
                <div ref={sentinelRef} className="h-1" aria-hidden />

                {loadingMore && (
                    <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                        {[...Array(4)].map((_, i) => <ProductCardSkeleton key={i} />)}
                    </div>
                )}

                {/* Accessible pagination fallback (no-JS) */}
                {products.last_page > 1 && (
                    <noscript>
                        <div className="mt-10 flex flex-wrap items-center justify-center gap-1">
                            {(products.links ?? []).map((link, i) => (
                                link.url ? (
                                    <a key={i} href={link.url}
                                        className={`flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg px-3 text-sm transition-colors
                                            ${link.active ? 'bg-brand text-white font-medium' : 'border border-ink-200 text-ink-700 hover:bg-ink-50'}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ) : (
                                    <span key={i}
                                        className="flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg border border-ink-200 px-3 text-sm text-ink-300 cursor-default"
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                )
                            ))}
                        </div>
                    </noscript>
                )}
            </Container>
        </PageLayout>
    );
}
