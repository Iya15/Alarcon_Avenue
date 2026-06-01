import Container from '@/Components/layout/Container';
import PageLayout from '@/Components/layout/PageLayout';
import SeoHead from '@/Components/layout/SeoHead';
import type { PageProps } from '@/types';
import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';

interface ProductImage { url: string; alt_text: string | null }
interface ProductCard {
    id: number; name: string; slug: string;
    base_price_cents: number; compare_at_price_cents: number | null;
    lowest_price_cents: number; in_stock: boolean; is_featured: boolean;
    primary_image: ProductImage | null;
}
interface Category { id: number; name: string; slug: string; image_url: string | null; children?: Category[] }

interface Props extends PageProps {
    featured: ProductCard[];
    bestsellers: ProductCard[];
    personalized: ProductCard[];
    topCategories: Category[];
    heroCategories: Category[];
}

function formatPrice(cents: number) {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(cents / 100);
}

function ProductCard({ product }: { product: ProductCard }) {
    return (
        <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}>
            <Link href={route('products.show', product.slug)} className="group block">
                <div className="relative overflow-hidden rounded-xl bg-ink-100">
                    <div className="aspect-[4/5]">
                        {product.primary_image ? (
                            <img
                                src={product.primary_image.url}
                                alt={product.primary_image.alt_text ?? product.name}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                loading="lazy"
                            />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center text-ink-300">
                                <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                </svg>
                            </div>
                        )}
                    </div>
                    {product.is_featured && (
                        <span className="absolute left-3 top-3 rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                            Featured
                        </span>
                    )}
                    {!product.in_stock && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink-700">Out of stock</span>
                        </div>
                    )}
                </div>
                <div className="mt-3 space-y-0.5">
                    <p className="truncate text-sm font-medium text-ink-900 group-hover:text-brand transition-colors">{product.name}</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-sm font-semibold text-ink-900">{formatPrice(product.lowest_price_cents)}</span>
                        {product.compare_at_price_cents && product.compare_at_price_cents > product.base_price_cents && (
                            <span className="text-xs text-ink-400 line-through">{formatPrice(product.compare_at_price_cents)}</span>
                        )}
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

function SectionHeader({ title, href }: { title: string; href?: string }) {
    return (
        <div className="flex items-baseline justify-between mb-6">
            <h2 className="text-xl font-bold text-ink-900">{title}</h2>
            {href && (
                <Link href={href} className="text-sm font-medium text-brand hover:underline">
                    View all
                </Link>
            )}
        </div>
    );
}

export default function Home({ auth, featured, bestsellers, personalized, topCategories, heroCategories }: Props) {
    const isAuthed = !!auth.user;

    return (
        <PageLayout>
            <SeoHead
                title="Shop Online"
                description="Alarcon Avenue — curated multi-category e-commerce. Browse fashion, electronics, home & more with free shipping on qualifying orders."
            />

            {/* Hero — always dark regardless of site theme, so force light-mode ink values */}
            <section data-theme="light" className="bg-ink-900 py-16 lg:py-24">
                <Container>
                    <div className="max-w-2xl">
                        <h1 className="text-4xl font-extrabold tracking-tight text-white lg:text-5xl">
                            Shop the Latest
                        </h1>
                        <p className="mt-4 text-lg text-ink-300">
                            Curated collections, unbeatable prices, delivered to your door.
                        </p>
                        <Link
                            href={route('products.index')}
                            className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand/90"
                        >
                            Shop All Products
                        </Link>
                    </div>

                    {heroCategories.length > 0 && (
                        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                            {heroCategories.map(cat => (
                                <Link
                                    key={cat.id}
                                    href={route('categories.show', cat.slug)}
                                    className="group flex flex-col items-center gap-2 rounded-xl bg-white/5 p-4 text-center transition hover:bg-white/10"
                                >
                                    {cat.image_url ? (
                                        <img src={cat.image_url} alt={cat.name} className="h-10 w-10 rounded-full object-cover" />
                                    ) : (
                                        <div className="h-10 w-10 rounded-full bg-white/10" />
                                    )}
                                    <span className="text-xs font-medium text-ink-200 group-hover:text-white">{cat.name}</span>
                                </Link>
                            ))}
                        </div>
                    )}
                </Container>
            </section>

            {/* Personalized section — authed users with history */}
            {isAuthed && personalized.length > 0 && (
                <section className="py-12">
                    <Container>
                        <div className="mb-2 flex items-center gap-2">
                            <span className="rounded-full bg-brand/10 px-3 py-0.5 text-xs font-semibold text-brand">For you</span>
                            {topCategories.length > 0 && (
                                <span className="text-xs text-ink-400">
                                    Based on your interest in{' '}
                                    {topCategories.slice(0, 2).map(c => c.name).join(' & ')}
                                </span>
                            )}
                        </div>
                        <SectionHeader title="Picked for You" href={route('products.index')} />
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                            {personalized.slice(0, 12).map(p => <ProductCard key={p.id} product={p} />)}
                        </div>
                    </Container>
                </section>
            )}

            {/* Featured */}
            {featured.length > 0 && (
                <section className="py-12 bg-surface">
                    <Container>
                        <SectionHeader title="Featured Products" href={route('products.index')} />
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                            {featured.slice(0, 12).map(p => <ProductCard key={p.id} product={p} />)}
                        </div>
                    </Container>
                </section>
            )}

            {/* Bestsellers */}
            {bestsellers.length > 0 && (
                <section className="py-12">
                    <Container>
                        <SectionHeader title="Best Sellers" href={route('products.index')} />
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                            {bestsellers.slice(0, 12).map(p => <ProductCard key={p.id} product={p} />)}
                        </div>
                    </Container>
                </section>
            )}
        </PageLayout>
    );
}
