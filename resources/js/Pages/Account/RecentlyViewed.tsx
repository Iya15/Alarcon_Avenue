import EmptyState from '@/Components/ui/EmptyState';
import AccountLayout from '@/Components/account/AccountLayout';
import type { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';

interface RecentItem {
    product_id: number; name: string | null; slug: string | null; brand_name: string | null;
    price_cents: number | null; viewed_at: string; image_url: string | null;
}
interface Props extends PageProps { items: RecentItem[] }

function formatPrice(cents: number) {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(cents / 100);
}

export default function AccountRecentlyViewed({ items }: Props) {
    return (
        <AccountLayout title="Recently Viewed">
            <Head title="Recently Viewed" />

            {items.length === 0 ? (
                <EmptyState title="Nothing here yet" description="Products you browse will appear here." />
            ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {items.map((item) => (
                        <Link key={item.product_id} href={item.slug ? route('products.show', item.slug) : '#'}
                            className="group block">
                            <div className="aspect-square overflow-hidden rounded-xl bg-ink-100">
                                {item.image_url
                                    ? <img src={item.image_url} alt={item.name ?? ''} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                    : <div className="h-full w-full bg-ink-200" />}
                            </div>
                            <div className="mt-2 px-0.5">
                                {item.brand_name && <p className="text-[10px] font-medium uppercase tracking-wider text-ink-400">{item.brand_name}</p>}
                                <p className="truncate text-sm font-medium text-ink-900 group-hover:text-brand-600">{item.name}</p>
                                {item.price_cents && <p className="text-sm font-semibold text-ink-950">{formatPrice(item.price_cents)}</p>}
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </AccountLayout>
    );
}
