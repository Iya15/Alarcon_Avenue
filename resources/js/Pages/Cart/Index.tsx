import Badge from '@/Components/ui/Badge';
import Button from '@/Components/ui/Button';
import EmptyState from '@/Components/ui/EmptyState';
import Container from '@/Components/layout/Container';
import PageLayout from '@/Components/layout/PageLayout';
import CartItemRow from '@/Components/cart/CartItemRow';
import CartSummary from '@/Components/cart/CartSummary';
import type { CartData } from '@/stores/cartStore';
import { useCartStore } from '@/stores/cartStore';
import type { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

interface Props extends PageProps, CartData {}

export default function CartIndex(props: Props) {
    const { items, saved_items, totals, coupon_code } = props;
    const cartStore = useCartStore();

    // Hydrate the Zustand store from SSR props on mount
    useEffect(() => {
        cartStore.setCart({ items, saved_items, totals, coupon_code });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const storeItems      = cartStore.items;
    const storeSavedItems = cartStore.saved_items;
    const isEmpty         = storeItems.length === 0;

    return (
        <PageLayout breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Cart' }]}>
            <Head title="Your Cart" />

            <Container className="py-8 lg:py-12">
                <h1 className="mb-8 text-2xl font-bold tracking-tight text-ink-950 lg:text-3xl">
                    Your Cart
                    {cartStore.totals.items_count > 0 && (
                        <span className="ml-3 text-base font-normal text-ink-400">({cartStore.totals.items_count} items)</span>
                    )}
                </h1>

                {isEmpty ? (
                    <EmptyState
                        icon={
                            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                            </svg>
                        }
                        title="Your cart is empty"
                        description="Browse our catalogue to find something you'll love."
                        action={<Button href={route('products.index')}>Browse products</Button>}
                        size="lg"
                    />
                ) : (
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                        {/* Items */}
                        <div className="lg:col-span-2">
                            <AnimatePresence initial={false}>
                                {storeItems.map((item) => (
                                    <CartItemRow key={item.id} item={item} />
                                ))}
                            </AnimatePresence>

                            {storeSavedItems.length > 0 && (
                                <div className="mt-8">
                                    <h2 className="mb-4 text-base font-semibold text-ink-900">
                                        Saved for later ({storeSavedItems.length})
                                    </h2>
                                    <AnimatePresence initial={false}>
                                        {storeSavedItems.map((item) => (
                                            <CartItemRow key={item.id} item={item} />
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>

                        {/* Summary */}
                        <div>
                            <div className="sticky top-24 rounded-2xl border border-ink-200 bg-surface p-5">
                                <h2 className="mb-4 text-base font-semibold text-ink-900">Order Summary</h2>
                                <CartSummary showCoupon showCheckout />
                            </div>
                        </div>
                    </div>
                )}
            </Container>
        </PageLayout>
    );
}
