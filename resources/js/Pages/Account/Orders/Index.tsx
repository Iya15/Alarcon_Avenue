import Badge from '@/Components/ui/Badge';
import EmptyState from '@/Components/ui/EmptyState';
import Skeleton from '@/Components/ui/Skeleton';
import AccountLayout from '@/Components/account/AccountLayout';
import type { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';

interface Order {
    id: number; order_number: string; status: string; status_label: string;
    total_cents: number; items_count?: number; created_at: string;
}
interface Props extends PageProps {
    orders: { data: Order[]; links: { url: string | null; label: string; active: boolean }[]; meta: { current_page: number; total: number } };
}

function formatPrice(cents: number) {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(cents / 100);
}

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'brand' | 'subtle'> = {
    pending: 'warning', awaiting_payment: 'warning', paid: 'brand',
    processing: 'brand', shipped: 'success', delivered: 'success',
    cancelled: 'subtle', refunded: 'subtle', partially_refunded: 'subtle',
};

export default function AccountOrdersIndex({ orders }: Props) {
    return (
        <AccountLayout title="Order History">
            <Head title="Orders" />

            {orders.data.length === 0 ? (
                <EmptyState title="No orders yet" description="Your order history will appear here once you make a purchase."
                    action={<Link href={route('products.index')} className="text-sm font-medium text-brand-600">Start shopping</Link>} />
            ) : (
                <div className="space-y-3">
                    {orders.data.map((order) => (
                        <Link key={order.id} href={route('account.orders.show', order.id)}
                            className="block rounded-xl border border-ink-200 bg-surface p-4 transition-shadow hover:shadow-md">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="font-mono text-sm font-semibold text-ink-900">{order.order_number}</p>
                                    <p className="text-xs text-ink-400">
                                        {new Date(order.created_at).toLocaleDateString('en-PH', { dateStyle: 'medium' })}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge variant={statusVariant[order.status] ?? 'default'} dot size="sm">
                                        {order.status_label}
                                    </Badge>
                                    <span className="text-sm font-semibold text-ink-950">{formatPrice(order.total_cents)}</span>
                                    <svg className="h-4 w-4 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </Link>
                    ))}

                    {/* Pagination */}
                    {orders.meta.total > 10 && (
                        <div className="flex items-center justify-center gap-1 pt-4">
                            {orders.links.map((link, i) => (
                                link.url ? (
                                    <Link key={i} href={link.url} className={`flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2 text-xs ${link.active ? 'bg-brand-500 text-white' : 'border border-ink-200 text-ink-700 hover:bg-ink-50'}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }} />
                                ) : (
                                    <span key={i} className="flex h-8 min-w-[2rem] items-center justify-center px-2 text-xs text-ink-300"
                                        dangerouslySetInnerHTML={{ __html: link.label }} />
                                )
                            ))}
                        </div>
                    )}
                </div>
            )}
        </AccountLayout>
    );
}
