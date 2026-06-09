import EmptyState from '@/Components/ui/EmptyState';
import AccountLayout from '@/Components/account/AccountLayout';
import type { PageProps } from '@/types';
import { Head, Link, router } from '@inertiajs/react';

interface OrderItem { product_name: string; quantity: number }
interface Order {
    id: number; order_number: string; status: string; status_label: string;
    total_cents: number; created_at: string;
    items: OrderItem[];
}

// Shape produced by LengthAwarePaginator->through()->toArray() — flat, no meta wrapper
interface PaginatedOrders {
    data: Order[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
}

type GroupKey = 'all' | 'to_pay' | 'to_ship' | 'to_receive' | 'completed' | 'cancelled' | 'refunded';

interface Props extends PageProps {
    orders:      PaginatedOrders;
    counts:      Record<GroupKey, number>;
    activeGroup: GroupKey;
}

// ── Tab configuration ─────────────────────────────────────────────────────────

const TABS: { key: GroupKey; label: string }[] = [
    { key: 'all',        label: 'All Orders'  },
    { key: 'to_pay',     label: 'To Pay'      },
    { key: 'to_ship',    label: 'To Ship'     },
    { key: 'to_receive', label: 'To Receive'  },
    { key: 'completed',  label: 'Completed'   },
    { key: 'cancelled',  label: 'Cancelled'   },
    { key: 'refunded',   label: 'Refunded'    },
];

// ── Status badge colour ───────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
    pending:            'bg-yellow-100 text-yellow-700',
    awaiting_payment:   'bg-yellow-100 text-yellow-700',
    paid:               'bg-orange-100 text-orange-700',
    processing:         'bg-orange-100 text-orange-700',
    shipped:            'bg-blue-100   text-blue-700',
    delivered:          'bg-green-100  text-green-700',
    cancelled:          'bg-ink-100    text-ink-500',
    refunded:           'bg-ink-100    text-ink-500',
    partially_refunded: 'bg-ink-100    text-ink-500',
};

function formatPrice(cents: number) {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(cents / 100);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AccountOrdersIndex({ orders, counts, activeGroup }: Props) {
    const navigate = (group: GroupKey) => {
        router.get(route('account.orders.index'), { group }, { preserveScroll: true });
    };

    return (
        <AccountLayout title="Order History">
            <Head title="Orders" />

            {/* ── Status tabs ─────────────────────────────────────────────── */}
            <div className="mb-5 -mx-1 flex gap-1 overflow-x-auto pb-1">
                {TABS.map(({ key, label }) => {
                    const count  = counts?.[key] ?? 0;
                    const active = activeGroup === key;
                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => navigate(key)}
                            className={[
                                'flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors whitespace-nowrap',
                                active
                                    ? 'bg-ink-900 text-white'
                                    : 'bg-ink-100 text-ink-600 hover:bg-ink-200 hover:text-ink-900',
                            ].join(' ')}
                        >
                            {label}
                            {/* Count badge — only on non-"all" tabs with at least 1 order */}
                            {key !== 'all' && count > 0 && (
                                <span className={[
                                    'flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none',
                                    active ? 'bg-brand text-white' : 'bg-yellow-400 text-yellow-900',
                                ].join(' ')}>
                                    {count > 99 ? '99+' : count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ── Order list ──────────────────────────────────────────────── */}
            {orders.data.length === 0 ? (
                <EmptyState
                    title={activeGroup === 'all' ? 'No orders yet' : 'No orders in this category'}
                    description={activeGroup === 'all'
                        ? 'Your order history will appear here once you make a purchase.'
                        : 'Orders matching this status will show here.'}
                    action={
                        activeGroup !== 'all'
                            ? <button type="button" onClick={() => navigate('all')} className="text-sm font-medium text-brand hover:underline">View all orders</button>
                            : <Link href={route('products.index')} className="text-sm font-medium text-brand">Start shopping</Link>
                    }
                />
            ) : (
                <div className="space-y-3">
                    {orders.data.map((order) => (
                        <Link
                            key={order.id}
                            href={route('account.orders.show', order.id)}
                            className="block rounded-xl border border-ink-200 bg-surface p-4 transition hover:shadow-md"
                        >
                            <div className="flex items-center justify-between gap-4">
                                <div className="min-w-0">
                                    {/* Product names */}
                                    <p className="truncate text-sm font-medium text-ink-900">
                                        {order.items.slice(0, 2).map((i) => i.product_name).join(', ')}
                                        {order.items.length > 2 && (
                                            <span className="text-ink-400"> +{order.items.length - 2} more</span>
                                        )}
                                    </p>
                                    <p className="mt-0.5 font-mono text-xs text-ink-500">{order.order_number}</p>
                                    <p className="text-xs text-ink-400">
                                        {new Date(order.created_at).toLocaleString('en-PH', {
                                            month: 'short', day: 'numeric', year: 'numeric',
                                            hour: 'numeric', minute: '2-digit', hour12: true,
                                        })}
                                    </p>
                                </div>
                                <div className="flex shrink-0 items-center gap-3">
                                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOR[order.status] ?? 'bg-ink-100 text-ink-500'}`}>
                                        {order.status_label}
                                    </span>
                                    <span className="text-sm font-semibold text-ink-950">{formatPrice(order.total_cents)}</span>
                                    <svg className="h-4 w-4 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </Link>
                    ))}

                    {/* Pagination */}
                    {orders.total > orders.per_page && (
                        <div className="flex items-center justify-center gap-1 pt-4">
                            {orders.links.map((link, i) => (
                                link.url ? (
                                    <Link key={i} href={link.url}
                                        className={`flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2 text-xs transition-colors ${link.active ? 'bg-brand text-white' : 'border border-ink-200 text-ink-700 hover:bg-ink-50'}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ) : (
                                    <span key={i}
                                        className="flex h-8 min-w-[2rem] items-center justify-center px-2 text-xs text-ink-300"
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                )
                            ))}
                        </div>
                    )}
                </div>
            )}
        </AccountLayout>
    );
}
