import Badge from '@/Components/ui/Badge';
import Button from '@/Components/ui/Button';
import Card from '@/Components/ui/Card';
import AddToCartButton from '@/Components/cart/AddToCartButton';
import Container from '@/Components/layout/Container';
import PageLayout from '@/Components/layout/PageLayout';
import SeoHead from '@/Components/layout/SeoHead';
import ReviewSection from '@/Components/reviews/ReviewSection';
import type { Review } from '@/Components/reviews/ReviewSection';
import type { PageProps } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { useEchoPublic } from '@laravel/echo-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Inventory { available: number; in_stock: boolean; is_low_stock: boolean }
interface AttributeValue { id: number; attribute_id: number; value: string; display_value: string; meta: Record<string, string> | null }
interface ProductImage { id: number; url: string; alt_text: string | null; is_primary: boolean; variant_id: number | null }
interface Variant {
    id: number; sku: string; is_active: boolean;
    effective_price: number; price_override_cents: number | null; compare_at_price_cents: number | null;
    attribute_values: AttributeValue[];
    inventory: Inventory | null;
    images: ProductImage[];
}
interface Attribute { id: number; name: string; display_name: string; type: string }
interface Category { id: number; name: string; slug: string }

interface Product {
    id: number; name: string; slug: string;
    description: string | null; short_description: string | null;
    base_price_cents: number; compare_at_price_cents: number | null;
    status: string; is_featured: boolean;
    meta_title: string | null; meta_description: string | null;
    categories: Category[];
    images: ProductImage[];
    variants: Variant[];
    rating_average: number | null; review_count: number;
    reviews: Review[];
}

interface ProductCard {
    id: number; name: string; slug: string;
    base_price_cents: number; lowest_price_cents: number;
    in_stock: boolean; primary_image: ProductImage | null;
}

interface Props extends PageProps {
    product: Product;
    relatedProducts: ProductCard[];
}

function formatPrice(cents: number) {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(cents / 100);
}

function ImageGallery({ images, productName }: { images: ProductImage[]; productName: string }) {
    const [active, setActive] = useState(0);
    const [zoomed, setZoomed] = useState(false);

    if (images.length === 0) {
        return (
            <div className="aspect-square w-full rounded-2xl bg-ink-100 flex items-center justify-center text-ink-300">
                <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3 lg:flex-row-reverse">
            {/* Main image */}
            <div
                className="relative flex-1 overflow-hidden rounded-2xl bg-ink-100 cursor-zoom-in"
                onClick={() => setZoomed(!zoomed)}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={active}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: { duration: 0.15 } }}
                        exit={{ opacity: 0, transition: { duration: 0.1 } }}
                        className="aspect-square"
                    >
                        <img
                            src={images[active].url}
                            alt={images[active].alt_text ?? productName}
                            className={`h-full w-full object-cover transition-transform duration-300 ${zoomed ? 'scale-150' : 'scale-100'}`}
                        />
                    </motion.div>
                </AnimatePresence>
                <span className="absolute bottom-3 right-3 rounded-lg bg-black/40 px-2 py-1 text-[10px] text-white backdrop-blur-sm">
                    {active + 1} / {images.length}
                </span>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
                <div className="flex gap-2 lg:flex-col lg:w-16">
                    {images.map((img, i) => (
                        <button
                            key={img.id}
                            onClick={() => { setActive(i); setZoomed(false); }}
                            className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                                i === active ? 'border-brand-500' : 'border-transparent hover:border-ink-300'
                            }`}
                        >
                            <img src={img.url} alt={img.alt_text ?? ''} className="h-full w-full object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function VariantSelector({
    variants, selected, onSelect,
}: { variants: Variant[]; selected: Variant | null; onSelect: (v: Variant) => void }) {
    const attributeGroups = new Map<number, { attribute: Attribute; values: AttributeValue[] }>();

    variants.forEach((v) => {
        v.attribute_values.forEach((av) => {
            if (!attributeGroups.has(av.attribute_id)) {
                attributeGroups.set(av.attribute_id, {
                    attribute: { id: av.attribute_id, name: av.value, display_name: av.value, type: 'select' },
                    values: [],
                });
            }
            const group = attributeGroups.get(av.attribute_id)!;
            if (!group.values.find((x) => x.id === av.id)) {
                group.values.push(av);
            }
        });
    });

    if (attributeGroups.size === 0) return null;

    return (
        <div className="space-y-4">
            {Array.from(attributeGroups.values()).map(({ attribute, values }) => {
                const selectedValue = selected?.attribute_values.find((av) => av.attribute_id === attribute.id);

                return (
                    <div key={attribute.id}>
                        <div className="mb-2 flex items-baseline gap-2">
                            <span className="text-sm font-medium text-ink-900">{attribute.display_name}</span>
                            {selectedValue && (
                                <span className="text-sm text-ink-500">{selectedValue.display_value}</span>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {values.map((val) => {
                                const matchingVariant = variants.find((v) =>
                                    v.attribute_values.some((av) => av.id === val.id)
                                );
                                const isSelected = selected?.attribute_values.some((av) => av.id === val.id);
                                const outOfStock = !matchingVariant?.inventory?.in_stock;
                                const isColorSwatch = val.meta?.hex;

                                if (isColorSwatch) {
                                    return (
                                        <button
                                            key={val.id}
                                            onClick={() => matchingVariant && onSelect(matchingVariant)}
                                            disabled={outOfStock}
                                            title={val.display_value}
                                            className={`h-8 w-8 rounded-full border-2 transition-all ${
                                                isSelected ? 'border-brand-500 ring-2 ring-brand-500 ring-offset-1' : 'border-transparent hover:border-ink-400'
                                            } ${outOfStock ? 'opacity-30 cursor-not-allowed' : ''}`}
                                            style={{ backgroundColor: val.meta?.hex }}
                                        />
                                    );
                                }

                                return (
                                    <button
                                        key={val.id}
                                        onClick={() => matchingVariant && onSelect(matchingVariant)}
                                        disabled={outOfStock}
                                        className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                                            isSelected
                                                ? 'border-brand-500 bg-brand-50 text-brand-700 font-medium'
                                                : 'border-ink-200 text-ink-700 hover:border-ink-400'
                                        } ${outOfStock ? 'opacity-30 cursor-not-allowed line-through' : ''}`}
                                    >
                                        {val.display_value}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

interface StockPayload {
    product_id: number;
    variant_id: number;
    available: number;
    in_stock: boolean;
    is_low_stock: boolean;
}

export default function ProductShow({ product, relatedProducts }: Props) {
    const { auth } = usePage<PageProps>().props;
    const activeVariants = product.variants.filter((v) => v.is_active);
    const [selectedVariant, setSelectedVariant] = useState<Variant | null>(activeVariants[0] ?? null);
    const [quantity, setQuantity] = useState(1);

    // Live stock overrides keyed by variant_id — updated via Reverb broadcast
    const [liveStock, setLiveStock] = useState<Record<number, Pick<Inventory, 'available' | 'in_stock' | 'is_low_stock'>>>({});

    useEchoPublic<StockPayload>(
        `products.${product.id}`,
        '.stock.updated',
        (payload) => {
            setLiveStock((prev) => ({
                ...prev,
                [payload.variant_id]: {
                    available: payload.available,
                    in_stock: payload.in_stock,
                    is_low_stock: payload.is_low_stock,
                },
            }));
        },
        [product.id]
    );

    // Track recently viewed — authenticated users: POST to server; guests: localStorage
    useEffect(() => {
        if (auth.user) {
            window.axios.post('/api/account/recently-viewed', { product_id: product.id }).catch(() => {});
        } else {
            try {
                const key = 'aa_rv';
                const existing: number[] = JSON.parse(localStorage.getItem(key) ?? '[]');
                const updated = [product.id, ...existing.filter((id) => id !== product.id)].slice(0, 20);
                localStorage.setItem(key, JSON.stringify(updated));
            } catch {}
        }
    }, [product.id]); // eslint-disable-line react-hooks/exhaustive-deps

    const price = selectedVariant?.effective_price ?? product.base_price_cents;
    const comparePrice = selectedVariant?.compare_at_price_cents ?? product.compare_at_price_cents;
    // Merge live Reverb override (if any) with the server-rendered inventory
    const baseInventory = selectedVariant?.inventory;
    const inventory = selectedVariant
        ? { ...baseInventory, ...(liveStock[selectedVariant.id] ?? {}) } as Inventory | null
        : baseInventory;
    const inStock = inventory ? inventory.in_stock : false;
    const isLowStock = inventory?.is_low_stock ?? false;
    const maxQty = Math.min(inventory?.available ?? 1, 10);

    const galleryImages = selectedVariant?.images.length
        ? [...selectedVariant.images, ...product.images.filter((img) => img.variant_id === null)]
        : product.images;

    const breadcrumbs = [
        { label: 'Home', href: '/' },
        ...(product.categories[0]
            ? [{ label: product.categories[0].name, href: route('categories.show', product.categories[0].slug) }]
            : []),
        { label: product.name },
    ];

    const discountPct = comparePrice && comparePrice > price
        ? Math.round((1 - price / comparePrice) * 100)
        : null;

    // ── JSON-LD Product schema ────────────────────────────────────────────────
    const primaryImageUrl = product.images.find((i) => i.is_primary)?.url ?? product.images[0]?.url;
    const canonicalUrl    = typeof window !== 'undefined'
        ? `${window.location.origin}/products/${product.slug}`
        : `/products/${product.slug}`;

    const productSchema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name:  product.name,
        description: product.short_description ?? product.meta_description ?? undefined,
        url:   canonicalUrl,
        image: primaryImageUrl ? [primaryImageUrl] : undefined,
        offers: {
            '@type': 'Offer',
            price:        (price / 100).toFixed(2),
            priceCurrency: 'PHP',
            availability: inStock
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
            url: canonicalUrl,
        },
        ...(product.rating_average !== null && product.review_count > 0 ? {
            aggregateRating: {
                '@type':       'AggregateRating',
                ratingValue:   product.rating_average.toFixed(1),
                reviewCount:   product.review_count,
                bestRating:    '5',
                worstRating:   '1',
            },
        } : {}),
    };

    const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type':    'BreadcrumbList',
        itemListElement: breadcrumbs.map((crumb, idx) => ({
            '@type':    'ListItem',
            position:   idx + 1,
            name:       crumb.label,
            item:       crumb.href ? (typeof window !== 'undefined' ? `${window.location.origin}${crumb.href}` : crumb.href) : undefined,
        })),
    };

    return (
        <PageLayout breadcrumbs={breadcrumbs}>
            <SeoHead
                title={product.meta_title ?? product.name}
                description={product.meta_description ?? product.short_description}
                image={primaryImageUrl}
                type="product"
                canonicalUrl={canonicalUrl}
                jsonLd={[productSchema, breadcrumbSchema]}
            />

            <Container className="py-8 lg:py-12">
                <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
                    {/* Gallery */}
                    <div className="lg:sticky lg:top-24 lg:self-start">
                        <ImageGallery images={galleryImages} productName={product.name} />
                    </div>

                    {/* Details */}
                    <div className="flex flex-col gap-6">
                        {/* Category tags */}
                        {product.categories.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {product.categories.map((cat) => (
                                    <Link key={cat.id} href={route('categories.show', cat.slug)}>
                                        <Badge variant="subtle" size="sm">{cat.name}</Badge>
                                    </Link>
                                ))}
                            </div>
                        )}

                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-ink-950 lg:text-3xl">
                                {product.name}
                            </h1>

                            {product.rating_average !== null && product.review_count > 0 && (
                                <div className="mt-2 flex items-center gap-1.5">
                                    <div className="flex">
                                        {[1,2,3,4,5].map((s) => (
                                            <svg key={s} className={`h-4 w-4 ${s <= Math.round(product.rating_average!) ? 'text-[#e7901d]' : 'text-ink-200'}`} fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        ))}
                                    </div>
                                    <span className="text-sm text-ink-500">{product.rating_average.toFixed(1)} ({product.review_count} reviews)</span>
                                </div>
                            )}
                        </div>

                        {/* Pricing */}
                        <div className="flex items-baseline gap-3">
                            <span className="text-3xl font-bold text-ink-950">{formatPrice(price)}</span>
                            {comparePrice && comparePrice > price && (
                                <>
                                    <span className="text-lg text-ink-400 line-through">{formatPrice(comparePrice)}</span>
                                    <Badge variant="brand">-{discountPct}%</Badge>
                                </>
                            )}
                        </div>

                        {/* Stock status */}
                        <div className="flex items-center gap-2">
                            {inStock ? (
                                <>
                                    <span className="h-2 w-2 rounded-full bg-success-500" />
                                    <span className="text-sm text-success-600 font-medium">
                                        {isLowStock ? `Only ${inventory!.available} left` : 'In Stock'}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <span className="h-2 w-2 rounded-full bg-ink-300" />
                                    <span className="text-sm text-ink-500">Out of Stock</span>
                                </>
                            )}
                        </div>

                        {/* Short description */}
                        {product.short_description && (
                            <p className="text-sm leading-relaxed text-ink-600">{product.short_description}</p>
                        )}

                        {/* Variant selector */}
                        {activeVariants.length > 1 && (
                            <VariantSelector
                                variants={activeVariants}
                                selected={selectedVariant}
                                onSelect={setSelectedVariant}
                            />
                        )}

                        {/* Quantity + Add to Cart */}
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <div className="flex items-center rounded-lg border border-ink-200">
                                <button
                                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                    className="px-3 py-2 text-ink-500 hover:text-ink-900 disabled:opacity-40"
                                    disabled={quantity <= 1}
                                    aria-label="Decrease quantity"
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                                    </svg>
                                </button>
                                <span className="min-w-[2.5rem] text-center text-sm font-medium text-ink-900">{quantity}</span>
                                <button
                                    onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                                    className="px-3 py-2 text-ink-500 hover:text-ink-900 disabled:opacity-40"
                                    disabled={quantity >= maxQty || !inStock}
                                    aria-label="Increase quantity"
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                    </svg>
                                </button>
                            </div>

                            <AddToCartButton
                                variantId={selectedVariant?.id ?? 0}
                                quantity={quantity}
                                outOfStock={!inStock}
                                disabled={!selectedVariant}
                                className="flex-1"
                                size="lg"
                                fullWidth={false}
                            />
                        </div>

                        <p className="text-xs text-ink-400">
                            SKU: {selectedVariant?.sku ?? '—'}
                        </p>
                    </div>
                </div>

                {/* Full description */}
                {product.description && (
                    <div className="mt-16 border-t border-ink-200 pt-10">
                        <h2 className="mb-4 text-xl font-semibold tracking-tight text-ink-950">Description</h2>
                        <div
                            className="prose prose-sm max-w-none text-ink-700"
                            dangerouslySetInnerHTML={{ __html: product.description }}
                        />
                    </div>
                )}

                <ReviewSection
                    productId={product.id}
                    productSlug={product.slug}
                    reviews={product.reviews ?? []}
                    ratingAverage={product.rating_average}
                    reviewCount={product.review_count}
                />

                {/* Related products */}
                {relatedProducts.length > 0 && (
                    <div className="mt-16 border-t border-ink-200 pt-10">
                        <h2 className="mb-6 text-xl font-semibold tracking-tight text-ink-950">You might also like</h2>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                            {relatedProducts.map((p) => (
                                <Link key={p.id} href={route('products.show', p.slug)} className="group block">
                                    <div className="aspect-square overflow-hidden rounded-xl bg-ink-100">
                                        {p.primary_image ? (
                                            <img src={p.primary_image.url} alt={p.primary_image.alt_text ?? p.name}
                                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                        ) : (
                                            <div className="h-full w-full bg-ink-100" />
                                        )}
                                    </div>
                                    <p className="mt-2 truncate text-xs font-medium text-ink-900 group-hover:text-brand-600">{p.name}</p>
                                    <p className="text-xs text-ink-500">{formatPrice(p.lowest_price_cents)}</p>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </Container>
        </PageLayout>
    );
}
