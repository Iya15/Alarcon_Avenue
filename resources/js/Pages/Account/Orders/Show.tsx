import Badge from '@/Components/ui/Badge';
import Card from '@/Components/ui/Card';
import AccountLayout from '@/Components/account/AccountLayout';
import type { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';

interface OrderItem {
    id: number; product_name: string; variant_label: string | null; sku: string;
    unit_price_cents: number; quantity: number; subtotal_cents: number; image_url: string | null;
}
interface Order {
    id: number; order_number: string; status: string; status_label: string;
    shipping_address: Record<string, string | null>; subtotal_cents: number; discount_cents: number;
    shipping_cents: number; tax_cents: number; total_cents: number; created_at: string;
    paid_at: string | null; items: OrderItem[]; coupon_code: string | null;
}
interface Props extends PageProps { order: Order }

function formatPrice(cents: number) {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(cents / 100);
}

export default function AccountOrderShow({ order }: Props) {
    return (
        <AccountLayout title={`Order ${order.order_number}`}>
            <Head title={`Order ${order.order_number}`} />

            <div className="mb-4 flex items-center justify-between">
                <Link href={route('account.orders.index')} className="text-sm text-ink-500 hover:text-ink-900">← All orders</Link>
                <Badge variant={order.status === 'delivered' ? 'success' : order.status === 'cancelled' ? 'subtle' : 'brand'} dot>
                    {order.status_label}
                </Badge>
            </div>

            {/* Items */}
            <Card bordered className="mb-4">
                {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 border-b border-ink-100 py-3 last:border-b-0">
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                            {item.image_url && <img src={item.image_url} alt={item.product_name} className="h-full w-full object-cover" />}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-ink-900">{item.product_name}</p>
                            {item.variant_label && <p className="text-xs text-ink-500">{item.variant_label}</p>}
                            <p className="text-xs text-ink-400">Qty: {item.quantity} · {formatPrice(item.unit_price_cents)} each</p>
                        </div>
                        <span className="text-sm font-semibold text-ink-950">{formatPrice(item.subtotal_cents)}</span>
                    </div>
                ))}
            </Card>

            <div className="grid gap-4 sm:grid-cols-2">
                {/* Totals */}
                <Card bordered padding="sm">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-400">Summary</h3>
                    <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between"><span className="text-ink-600">Subtotal</span><span>{formatPrice(order.subtotal_cents)}</span></div>
                        {order.discount_cents > 0 && <div className="flex justify-between text-success-600"><span>Discount</span><span>-{formatPrice(order.discount_cents)}</span></div>}
                        <div className="flex justify-between text-ink-600"><span>Shipping</span><span>{order.shipping_cents === 0 ? 'Free' : formatPrice(order.shipping_cents)}</span></div>
                        <div className="flex justify-between border-t border-ink-100 pt-1.5 font-bold text-ink-950"><span>Total</span><span>{formatPrice(order.total_cents)}</span></div>
                    </div>
                </Card>

                {/* Shipping address */}
                <Card bordered padding="sm">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-400">Shipping to</h3>
                    <div className="text-sm text-ink-700 space-y-0.5">
                        <p className="font-medium">{order.shipping_address.first_name} {order.shipping_address.last_name}</p>
                        <p>{order.shipping_address.line_1}</p>
                        <p>{order.shipping_address.city}, {order.shipping_address.state}</p>
                        <p>{order.shipping_address.phone}</p>
                    </div>
                </Card>
            </div>
        </AccountLayout>
    );
}
