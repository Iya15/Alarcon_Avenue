import Badge from '@/Components/ui/Badge';
import Button from '@/Components/ui/Button';
import Drawer from '@/Components/ui/Drawer';
import type { CartItem } from '@/stores/cartStore';
import { useCartStore } from '@/stores/cartStore';
import { Link } from '@inertiajs/react';
import { AnimatePresence } from 'framer-motion';
import CartItemRow from './CartItemRow';
import CartSummary from './CartSummary';

export default function CartDrawer() {
    const { isOpen, close, items, saved_items, totals, isLoading } = useCartStore();

    const isEmpty = items.length === 0;

    return (
        <Drawer
            open={isOpen}
            onClose={close}
            side="right"
            size="md"
            title={`Cart${totals.items_count > 0 ? ` (${totals.items_count})` : ''}`}
            footer={
                !isEmpty ? (
                    <div className="space-y-3">
                        <CartSummary showCoupon={false} showCheckout={false} compact />
                        <Button href={route('cart.show')} variant="primary" size="lg" fullWidth onClick={close}>
                            View Cart & Checkout
                        </Button>
                    </div>
                ) : null
            }
        >
            {isLoading && items.length === 0 ? (
                <div className="flex h-40 items-center justify-center text-sm text-ink-400">
                    Loading…
                </div>
            ) : isEmpty ? (
                <div className="flex flex-col items-center py-12 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-100">
                        <svg className="h-7 w-7 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                        </svg>
                    </div>
                    <p className="font-semibold text-ink-900">Your cart is empty</p>
                    <p className="mt-1 text-sm text-ink-500">Add some products to get started.</p>
                    <Button href={route('products.index')} variant="secondary" size="sm" className="mt-5" onClick={close}>
                        Browse products
                    </Button>
                </div>
            ) : (
                <div className="space-y-0">
                    <AnimatePresence initial={false}>
                        {items.map((item) => (
                            <CartItemRow key={item.id} item={item} compact />
                        ))}
                    </AnimatePresence>

                    {saved_items.length > 0 && (
                        <div className="mt-4 border-t border-ink-100 pt-4">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-ink-400">
                                Saved for later ({saved_items.length})
                            </p>
                            <AnimatePresence initial={false}>
                                {saved_items.map((item) => (
                                    <SavedItemRow key={item.id} item={item} />
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            )}
        </Drawer>
    );
}

function SavedItemRow({ item }: { item: CartItem }) {
    const { saveForLater, removeItem } = useCartStore();

    return (
        <div className="flex items-center gap-3 py-2">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                {item.image_url && <img src={item.image_url} alt={item.product_name ?? ''} className="h-full w-full object-cover opacity-60" />}
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink-700">{item.product_name}</p>
                {item.variant_label && <p className="text-xs text-ink-400">{item.variant_label}</p>}
            </div>
            <div className="flex flex-col items-end gap-1">
                <button onClick={() => saveForLater(item.id)} className="text-xs font-medium text-brand-600 hover:text-brand-700">
                    Move to cart
                </button>
                <button onClick={() => removeItem(item.id)} className="text-xs text-ink-400 hover:text-danger-600">
                    Remove
                </button>
            </div>
        </div>
    );
}
