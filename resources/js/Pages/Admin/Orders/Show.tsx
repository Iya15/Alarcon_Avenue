import AdminLayout from '@/Components/layout/AdminLayout';
import { Head, router, useForm } from '@inertiajs/react';
import type { PageProps } from '@/types';

interface OrderItem { id: number; product_name: string; variant_label: string | null; sku: string; unit_price_cents: number; quantity: number; subtotal_cents: number }
interface Payment   { id: number; type: string; status: string; amount_cents: number; created_at: string }
interface Refund    { id: number; amount_cents: number; reason: string | null; status: string; created_at: string }
interface Order {
    id: number; order_number: string; status: string; status_label: string;
    total_cents: number; subtotal_cents: number; discount_cents: number; shipping_cents: number; tax_cents: number;
    currency: string; coupon_code: string | null; paid_at: string | null; created_at: string;
    user: { id: number | null; name: string; email: string };
    items: OrderItem[]; payments: Payment[]; refunds: Refund[];
}

interface Props extends PageProps { order: Order }

const STATUS_OPTIONS = ['pending','awaiting_payment','paid','processing','shipped','delivered','cancelled'];

function formatPHP(cents: number) { return `₱${(cents / 100).toLocaleString('en-PH')}`; }

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-ink-800 bg-ink-900 p-5">
            <h3 className="mb-3 text-sm font-semibold text-white">{title}</h3>
            {children}
        </div>
    );
}

export default function AdminOrderShow({ order }: Props) {
    const { data, setData, patch, processing } = useForm({ status: order.status });

    function submitStatus(e: React.FormEvent) {
        e.preventDefault();
        patch(route('admin.orders.update-status', order.id));
    }

    return (
        <AdminLayout title={`Order ${order.order_number}`}>
            <Head title={`Order ${order.order_number} — Admin`} />

            <div className="mb-5 flex items-center gap-3">
                <button onClick={() => router.get(route('admin.orders.index'))} className="text-xs text-ink-400 hover:text-white">← Orders</button>
                <span className="text-ink-600">/</span>
                <span className="font-mono text-sm text-[#e7901d]">{order.order_number}</span>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                {/* Left column */}
                <div className="space-y-4 lg:col-span-2">
                    <Section title="Items">
                        <table className="w-full text-xs">
                            <thead><tr className="border-b border-ink-800 text-ink-400">
                                <th className="pb-2 text-left">Product</th>
                                <th className="pb-2 text-right">Qty</th>
                                <th className="pb-2 text-right">Unit</th>
                                <th className="pb-2 text-right">Subtotal</th>
                            </tr></thead>
                            <tbody className="divide-y divide-ink-800">
                                {order.items.map((i) => (
                                    <tr key={i.id}>
                                        <td className="py-2">
                                            <p className="text-white font-medium">{i.product_name}</p>
                                            {i.variant_label && <p className="text-ink-500">{i.variant_label}</p>}
                                            <p className="text-ink-600">{i.sku}</p>
                                        </td>
                                        <td className="py-2 text-right text-ink-300">{i.quantity}</td>
                                        <td className="py-2 text-right text-ink-300">{formatPHP(i.unit_price_cents)}</td>
                                        <td className="py-2 text-right text-white font-medium">{formatPHP(i.subtotal_cents)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Section>

                    {order.payments.length > 0 && (
                        <Section title="Payments">
                            {order.payments.map((p) => (
                                <div key={p.id} className="flex items-center justify-between py-1.5 text-xs">
                                    <span className="text-ink-400">{p.type} · {p.status}</span>
                                    <span className="text-white">{formatPHP(p.amount_cents)}</span>
                                </div>
                            ))}
                        </Section>
                    )}

                    {order.refunds.length > 0 && (
                        <Section title="Refunds">
                            {order.refunds.map((r) => (
                                <div key={r.id} className="flex items-center justify-between py-1.5 text-xs">
                                    <span className="text-ink-400">{r.reason ?? '—'} · {r.status}</span>
                                    <span className="text-red-400">-{formatPHP(r.amount_cents)}</span>
                                </div>
                            ))}
                        </Section>
                    )}
                </div>

                {/* Right column */}
                <div className="space-y-4">
                    <Section title="Customer">
                        <p className="text-sm text-white font-medium">{order.user.name}</p>
                        <p className="text-xs text-ink-400">{order.user.email}</p>
                    </Section>

                    <Section title="Summary">
                        {[
                            ['Subtotal', formatPHP(order.subtotal_cents)],
                            ['Discount', order.discount_cents ? `-${formatPHP(order.discount_cents)}` : '—'],
                            ['Shipping', formatPHP(order.shipping_cents)],
                            ['Tax',      formatPHP(order.tax_cents)],
                            ['Total',    formatPHP(order.total_cents)],
                        ].map(([label, value]) => (
                            <div key={label} className="flex justify-between py-1 text-xs">
                                <span className="text-ink-400">{label}</span>
                                <span className={label === 'Total' ? 'text-white font-bold' : 'text-ink-300'}>{value}</span>
                            </div>
                        ))}
                        {order.coupon_code && (
                            <p className="mt-1 text-xs text-[#e7901d]">Coupon: {order.coupon_code}</p>
                        )}
                    </Section>

                    <Section title="Update Status">
                        <form onSubmit={submitStatus} className="flex flex-col gap-3">
                            <select
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value)}
                                className="w-full rounded-lg bg-ink-800 border border-ink-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e7901d]"
                            >
                                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                            </select>
                            <button
                                type="submit"
                                disabled={processing || data.status === order.status}
                                className="rounded-lg bg-[#e7901d] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:bg-[#c97a18]"
                            >
                                Update
                            </button>
                        </form>
                    </Section>
                </div>
            </div>
        </AdminLayout>
    );
}
