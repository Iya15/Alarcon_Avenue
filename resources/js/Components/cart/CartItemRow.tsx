import { cn } from '@/lib/cn';
import { type CartItem, useCartStore } from '@/stores/cartStore';
import { Link } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';

interface Props {
    item: CartItem;
    compact?: boolean;
}

function formatPrice(cents: number) {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(cents / 100);
}

export default function CartItemRow({ item, compact = false }: Props) {
    const { updateItem, removeItem, saveForLater } = useCartStore();

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20, transition: { duration: 0.15 } }}
            className={cn('flex gap-3 py-3', compact ? 'items-start' : 'items-start border-b border-ink-100 last:border-b-0')}
        >
            {/* Image */}
            <Link href={item.slug ? route('products.show', item.slug) : '#'} className="shrink-0">
                <div className={cn('overflow-hidden rounded-lg bg-ink-100', compact ? 'h-16 w-16' : 'h-20 w-20')}>
                    {item.image_url ? (
                        <img src={item.image_url} alt={item.product_name ?? ''} className="h-full w-full object-cover" />
                    ) : (
                        <div className="h-full w-full bg-ink-200" />
                    )}
                </div>
            </Link>

            {/* Details */}
            <div className="min-w-0 flex-1">
                {item.brand_name && (
                    <p className="text-[10px] font-medium uppercase tracking-wider text-ink-400">{item.brand_name}</p>
                )}
                <Link
                    href={item.slug ? route('products.show', item.slug) : '#'}
                    className="text-sm font-medium text-ink-900 hover:text-brand-600 line-clamp-2 leading-tight"
                >
                    {item.product_name}
                </Link>
                {item.variant_label && (
                    <p className="mt-0.5 text-xs text-ink-500">{item.variant_label}</p>
                )}
                {!item.in_stock && (
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-danger-600">Out of stock</p>
                )}

                <div className="mt-2 flex items-center justify-between gap-2">
                    {/* Quantity controls */}
                    <div className="flex items-center rounded-lg border border-ink-200">
                        <button
                            onClick={() => item.quantity > 1 ? updateItem(item.id, item.quantity - 1) : removeItem(item.id)}
                            className="flex h-7 w-7 items-center justify-center text-ink-500 hover:text-ink-900 transition-colors"
                            aria-label="Decrease"
                        >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                            </svg>
                        </button>
                        <span className="w-6 text-center text-sm font-medium text-ink-900">{item.quantity}</span>
                        <button
                            onClick={() => updateItem(item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.available}
                            className="flex h-7 w-7 items-center justify-center text-ink-500 hover:text-ink-900 disabled:opacity-30 transition-colors"
                            aria-label="Increase"
                        >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                        </button>
                    </div>

                    <span className="text-sm font-semibold text-ink-950">{formatPrice(item.line_total_cents)}</span>
                </div>

                {/* Actions */}
                <div className="mt-1.5 flex items-center gap-3">
                    <button
                        onClick={() => saveForLater(item.id)}
                        className="text-xs text-ink-400 hover:text-ink-700 transition-colors"
                    >
                        Save for later
                    </button>
                    <span className="text-ink-200">·</span>
                    <button
                        onClick={() => removeItem(item.id)}
                        className="text-xs text-ink-400 hover:text-danger-600 transition-colors"
                    >
                        Remove
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
