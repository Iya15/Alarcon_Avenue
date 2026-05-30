import AddToCartButton from '@/Components/cart/AddToCartButton';
import Container from '@/Components/layout/Container';
import PageLayout from '@/Components/layout/PageLayout';
import { useCompareStore } from '@/stores/compareStore';
import type { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';

interface ProductData {
    id: number;
    name: string;
    slug: string;
    base_price_cents: number;
    lowest_price_cents: number;
    compare_at_price_cents: number | null;
    rating_average: number | null;
    review_count: number;
    in_stock: boolean;
    brand: string | null;
    categories: string[];
    primary_image: { url: string } | null;
    // attribute_key → string[] | null
    attributes: Record<string, string[] | null>;
}

interface Props extends PageProps {
    products: ProductData[];
    // attribute_key → display_name
    attributes: Record<string, string>;
}

function formatPrice(cents: number) {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(cents / 100);
}

function Stars({ rating }: { rating: number | null }) {
    if (rating === null) return <span className="text-xs text-ink-400">No reviews</span>;
    return (
        <span className="flex items-center gap-1 text-xs">
            <span className="text-brand">{'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}</span>
            <span className="text-ink-500">{rating.toFixed(1)}</span>
        </span>
    );
}

export default function Compare({ products, attributes }: Props) {
    const { remove } = useCompareStore();
    const colCount   = products.length;

    if (colCount === 0) {
        return (
            <PageLayout>
                <Head title="Compare Products" />
                <Container className="py-16 text-center">
                    <p className="text-ink-500">No products selected for comparison.</p>
                    <Link href={route('products.index')} className="mt-4 inline-block text-sm font-medium text-brand underline">
                        Browse products
                    </Link>
                </Container>
            </PageLayout>
        );
    }

    // Determine which attribute rows have differing values across products — highlight those
    const hasDiff = (key: string): boolean => {
        const vals = products.map((p) => JSON.stringify(p.attributes[key] ?? null));
        return new Set(vals).size > 1;
    };

    const gridCols = {
        1: 'lg:grid-cols-1',
        2: 'lg:grid-cols-2',
        3: 'lg:grid-cols-3',
        4: 'lg:grid-cols-4',
    }[colCount] ?? 'lg:grid-cols-4';

    return (
        <PageLayout breadcrumbs={[{ label: 'Home', href: route('home') }, { label: 'Compare' }]}>
            <Head title="Compare Products" />

            <Container className="py-10">
                <h1 className="mb-8 text-2xl font-bold text-ink-900">Compare Products</h1>

                <div className="overflow-x-auto">
                    <div className={`grid min-w-[600px] grid-cols-${colCount} gap-4 ${gridCols}`}>

                        {/* ── Product header cards ───────────────────────────────── */}
                        {products.map((product) => (
                            <div key={product.id} className="rounded-2xl border border-ink-200 bg-white p-4">
                                <button
                                    type="button"
                                    onClick={() => remove(product.id)}
                                    className="ml-auto flex items-center gap-1 text-xs text-ink-400 hover:text-ink-700"
                                >
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Remove
                                </button>

                                <Link href={route('products.show', product.slug)}>
                                    <div className="mx-auto aspect-square w-full max-w-[180px] overflow-hidden rounded-xl bg-ink-50">
                                        {product.primary_image ? (
                                            <img src={product.primary_image.url} alt={product.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full bg-ink-100" />
                                        )}
                                    </div>
                                    <p className="mt-3 text-sm font-semibold text-ink-900 hover:text-brand">{product.name}</p>
                                </Link>

                                <div className="mt-1 flex items-baseline gap-2">
                                    <span className="font-bold text-ink-900">{formatPrice(product.lowest_price_cents)}</span>
                                    {product.compare_at_price_cents && product.compare_at_price_cents > product.base_price_cents && (
                                        <span className="text-xs text-ink-400 line-through">{formatPrice(product.compare_at_price_cents)}</span>
                                    )}
                                </div>

                                <Stars rating={product.rating_average} />

                                <div className="mt-3">
                                    {product.in_stock ? (
                                        <span className="text-xs font-medium text-green-600">In stock</span>
                                    ) : (
                                        <span className="text-xs font-medium text-red-500">Out of stock</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ── Comparison table ───────────────────────────────────────── */}
                    <table className="mt-6 w-full min-w-[600px] border-collapse text-sm">
                        <tbody>
                            {/* Fixed rows: Brand, Categories, Rating, Stock */}
                            {[
                                {
                                    label: 'Brand',
                                    getValue: (p: ProductData) => p.brand ?? '—',
                                    diff: new Set(products.map((p) => p.brand)).size > 1,
                                },
                                {
                                    label: 'Categories',
                                    getValue: (p: ProductData) => p.categories.join(', ') || '—',
                                    diff: new Set(products.map((p) => p.categories.join(','))).size > 1,
                                },
                                {
                                    label: 'Rating',
                                    getValue: (p: ProductData) =>
                                        p.rating_average !== null
                                            ? `${p.rating_average.toFixed(1)} (${p.review_count} reviews)`
                                            : '—',
                                    diff: new Set(products.map((p) => p.rating_average)).size > 1,
                                },
                            ].map(({ label, getValue, diff }) => (
                                <tr key={label} className={diff ? 'bg-brand/5' : 'bg-white'}>
                                    <th className="w-36 border border-ink-200 px-4 py-3 text-left font-semibold text-ink-700">
                                        {label}
                                        {diff && <span className="ml-1 text-[10px] text-brand font-normal">(differs)</span>}
                                    </th>
                                    {products.map((p) => (
                                        <td key={p.id} className="border border-ink-200 px-4 py-3 text-ink-700">
                                            {getValue(p)}
                                        </td>
                                    ))}
                                </tr>
                            ))}

                            {/* Dynamic attribute rows */}
                            {Object.entries(attributes).map(([key, displayName]) => {
                                const diff = hasDiff(key);
                                return (
                                    <tr key={key} className={diff ? 'bg-brand/5' : 'bg-white'}>
                                        <th className="w-36 border border-ink-200 px-4 py-3 text-left font-semibold text-ink-700">
                                            {displayName}
                                            {diff && <span className="ml-1 text-[10px] text-brand font-normal">(differs)</span>}
                                        </th>
                                        {products.map((p) => (
                                            <td key={p.id} className="border border-ink-200 px-4 py-3 text-ink-600">
                                                {p.attributes[key]?.join(', ') ?? '—'}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {/* ── Add to cart row ────────────────────────────────────────── */}
                    <div className={`mt-6 grid min-w-[600px] grid-cols-${colCount} gap-4 ${gridCols}`}>
                        {products.map((product) => (
                            <Link
                                key={product.id}
                                href={route('products.show', product.slug)}
                                className="block rounded-xl border border-brand bg-brand px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-brand/90"
                            >
                                View Product
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        type="button"
                        onClick={() => {
                            useCompareStore.getState().clear();
                            window.history.back();
                        }}
                        className="text-sm text-ink-500 hover:text-ink-700"
                    >
                        Clear comparison
                    </button>
                </div>
            </Container>
        </PageLayout>
    );
}
