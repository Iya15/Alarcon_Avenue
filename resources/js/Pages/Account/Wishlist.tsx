import Badge from '@/Components/ui/Badge';
import Button from '@/Components/ui/Button';
import EmptyState from '@/Components/ui/EmptyState';
import AddToCartButton from '@/Components/cart/AddToCartButton';
import AccountLayout from '@/Components/account/AccountLayout';
import type { PageProps } from '@/types';
import { Head, Link, router } from '@inertiajs/react';

interface WishlistItem {
    id: number; wishlist_id: number; product_id: number; variant_id: number | null;
    product_name: string | null; product_slug: string | null; brand_name: string | null;
    price_cents: number | null; in_stock: boolean; image_url: string | null;
}
interface Props extends PageProps { items: WishlistItem[]; wishlistId: number | null }

function formatPrice(cents: number) {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(cents / 100);
}

export default function AccountWishlist({ items, wishlistId }: Props) {
    const remove = (id: number) => router.delete(route('account.wishlist.destroy', id));

    return (
        <AccountLayout title="Wishlist">
            <Head title="Wishlist" />

            {items.length === 0 ? (
                <EmptyState title="Your wishlist is empty"
                    description="Save products you love to come back to them later."
                    action={<Button href={route('products.index')}>Browse products</Button>} />
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {items.map((item) => (
                        <div key={item.id} className="flex gap-3 rounded-xl border border-ink-200 bg-surface p-3">
                            <Link href={item.product_slug ? route('products.show', item.product_slug) : '#'} className="shrink-0">
                                <div className="h-20 w-20 overflow-hidden rounded-lg bg-ink-100">
                                    {item.image_url && <img src={item.image_url} alt={item.product_name ?? ''} className="h-full w-full object-cover" />}
                                </div>
                            </Link>
                            <div className="min-w-0 flex-1">
                                {item.brand_name && <p className="text-[10px] font-medium uppercase tracking-wider text-ink-400">{item.brand_name}</p>}
                                <Link href={item.product_slug ? route('products.show', item.product_slug) : '#'} className="text-sm font-medium text-ink-900 hover:text-brand-600 line-clamp-2 leading-tight">
                                    {item.product_name}
                                </Link>
                                {item.price_cents && <p className="mt-0.5 text-sm font-semibold text-ink-950">{formatPrice(item.price_cents)}</p>}
                                {!item.in_stock && <Badge variant="subtle" size="sm" className="mt-1">Out of stock</Badge>}
                                <div className="mt-2 flex gap-2">
                                    {item.variant_id && (
                                        <AddToCartButton variantId={item.variant_id} outOfStock={!item.in_stock} size="sm" fullWidth={false} />
                                    )}
                                    <Button variant="ghost" size="sm" onClick={() => remove(item.id)}>Remove</Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </AccountLayout>
    );
}
