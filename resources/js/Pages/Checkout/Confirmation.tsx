import Badge from '@/Components/ui/Badge';
import Button from '@/Components/ui/Button';
import Container from '@/Components/layout/Container';
import PageLayout from '@/Components/layout/PageLayout';
import { useCartStore } from '@/stores/cartStore';
import type { PageProps } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useEffect } from 'react';

interface OrderItem {
    id: number;
    product_name: string;
    variant_label: string | null;
    sku: string;
    unit_price_cents: number;
    quantity: number;
    subtotal_cents: number;
    image_url: string | null;
    product_slug: string | null;
}

interface Order {
    id: number;
    order_number: string;
    status: string;
    status_label: string;
    shipping_address: Record<string, string | null>;
    billing_address: Record<string, string | null>;
    subtotal_cents: number;
    discount_cents: number;
    shipping_cents: number;
    tax_cents: number;
    total_cents: number;
    currency: string;
    customer_notes: string | null;
    created_at: string;
    items: OrderItem[];
    coupon_code: string | null;
}

interface Props extends PageProps {
    order: Order;
}

function formatPrice(cents: number) {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(cents / 100);
}

function PayNowButton({ orderNumber }: { orderNumber: string }) {
    const { post, processing } = useForm();
    return (
        <Button
            variant="primary"
            fullWidth
            size="lg"
            loading={processing}
            onClick={() => post(route('payment.initiate', orderNumber))}
        >
            Pay Now
        </Button>
    );
}

export default function CheckoutConfirmation({ order }: Props) {
    const { clearCart, fetchCart } = useCartStore();

    // Refresh the cart state (it was cleared on the server during order placement)
    useEffect(() => {
        fetchCart();
    }, []);

    return (
        <PageLayout breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Order Confirmation' }]}>
            <Head title={`Order ${order.order_number} — Confirmed`} />

            <Container size="md" className="py-12">
                {/* Success header */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mb-10 text-center"
                >
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-success-100">
                        <svg className="h-8 w-8 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-ink-950">Order confirmed!</h1>
                    <p className="mt-2 text-ink-500">
                        Thank you for your purchase. We'll get it ready for you soon.
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-2">
                        <span className="text-sm text-ink-500">Order number:</span>
                        <code className="rounded-md bg-ink-100 px-2 py-0.5 text-sm font-bold tracking-wider text-ink-900">
                            {order.order_number}
                        </code>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                    {/* Order items */}
                    <div className="space-y-4 lg:col-span-3">
                        <h2 className="text-sm font-semibold uppercase tracking-widest text-ink-400">Items ordered</h2>
                        <div className="rounded-2xl border border-ink-200 bg-surface">
                            {order.items.map((item, i) => (
                                <div
                                    key={item.id}
                                    className={`flex items-center gap-4 p-4 ${i < order.items.length - 1 ? 'border-b border-ink-100' : ''}`}
                                >
                                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                                        {item.image_url ? (
                                            <img src={item.image_url} alt={item.product_name} className="h-full w-full object-cover" />
                                        ) : <div className="h-full w-full bg-ink-200" />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        {item.product_slug ? (
                                            <Link href={route('products.show', item.product_slug)} className="text-sm font-medium text-ink-900 hover:text-brand-600">
                                                {item.product_name}
                                            </Link>
                                        ) : (
                                            <p className="text-sm font-medium text-ink-900">{item.product_name}</p>
                                        )}
                                        {item.variant_label && <p className="text-xs text-ink-500">{item.variant_label}</p>}
                                        <p className="text-xs text-ink-400">Qty: {item.quantity}</p>
                                    </div>
                                    <span className="shrink-0 text-sm font-semibold text-ink-950">
                                        {formatPrice(item.subtotal_cents)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Shipping address */}
                        <h2 className="text-sm font-semibold uppercase tracking-widest text-ink-400">Shipping to</h2>
                        <div className="rounded-2xl border border-ink-200 bg-surface p-4 text-sm text-ink-700 space-y-0.5">
                            <p className="font-medium text-ink-900">{order.shipping_address.first_name} {order.shipping_address.last_name}</p>
                            <p>{order.shipping_address.line_1}{order.shipping_address.line_2 ? `, ${order.shipping_address.line_2}` : ''}</p>
                            <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}</p>
                            <p>{order.shipping_address.phone}</p>
                        </div>
                    </div>

                    {/* Order summary */}
                    <div className="lg:col-span-2">
                        <div className="sticky top-24 rounded-2xl border border-ink-200 bg-surface p-5">
                            <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-ink-400">Summary</h2>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm text-ink-600"><span>Subtotal</span><span>{formatPrice(order.subtotal_cents)}</span></div>
                                {order.discount_cents > 0 && (
                                    <div className="flex justify-between text-sm text-success-600">
                                        <span>Discount {order.coupon_code && <span className="ml-1 rounded bg-success-100 px-1 text-[10px]">{order.coupon_code}</span>}</span>
                                        <span>-{formatPrice(order.discount_cents)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm text-ink-600">
                                    <span>Shipping</span>
                                    <span>{order.shipping_cents === 0 ? 'Free' : formatPrice(order.shipping_cents)}</span>
                                </div>
                                <div className="flex justify-between text-xs text-ink-400"><span>VAT (12%, incl.)</span><span>{formatPrice(order.tax_cents)}</span></div>
                                <div className="flex justify-between border-t border-ink-200 pt-2 text-base font-bold text-ink-950">
                                    <span>Total</span><span>{formatPrice(order.total_cents)}</span>
                                </div>
                            </div>

                            <div className="mt-5 space-y-2">
                                <Badge
                                    variant={order.status === 'paid' ? 'success' : order.status === 'pending' || order.status === 'awaiting_payment' ? 'warning' : 'default'}
                                    dot
                                >
                                    {order.status_label}
                                </Badge>
                                <p className="text-xs text-ink-400">
                                    Ordered on {new Date(order.created_at).toLocaleDateString('en-PH', { dateStyle: 'medium' })}
                                </p>
                            </div>

                            {order.customer_notes && (
                                <div className="mt-4 rounded-lg bg-ink-50 p-3 text-xs text-ink-600">
                                    <p className="mb-0.5 font-semibold text-ink-700">Your notes</p>
                                    {order.customer_notes}
                                </div>
                            )}

                            <div className="mt-5 space-y-2">
                                {/* Show Pay Now button for orders that haven't been paid yet */}
                                {order.status === 'pending' && (
                                    <PayNowButton orderNumber={order.order_number} />
                                )}
                                <Button href={route('products.index')} variant={order.status === 'pending' ? 'secondary' : 'primary'} fullWidth>
                                    Continue shopping
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </Container>
        </PageLayout>
    );
}
