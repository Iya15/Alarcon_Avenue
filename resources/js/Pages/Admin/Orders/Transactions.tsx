import AdminLayout from '@/Components/layout/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import type { PageProps } from '@/types';

interface Payment {
    id: number;
    type: string;
    gateway: string;
    method: string | null;
    amount_cents: number;
    status: string;
    captured_at: string | null;
    refunded_at: string | null;
    failed_at: string | null;
}

interface Order {
    id: number;
    order_number: string;
    status: string;
    status_label: string;
    total_cents: number;
}

interface Props extends PageProps {
    order: Order;
    payments: Payment[];
}

function formatPrice(cents: number) {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(cents / 100);
}

function formatDate(iso: string | null) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });
}

const typeLabel: Record<string, string> = {
    charge: 'Charge',
    refund: 'Refund',
};

const statusColor: Record<string, string> = {
    pending:   'bg-yellow-50 text-yellow-700',
    captured:  'bg-green-50 text-green-700',
    refunded:  'bg-blue-50 text-blue-700',
    failed:    'bg-red-50 text-red-700',
};

export default function OrderTransactions({ order, payments }: Props) {
    return (
        <AdminLayout title={`Transactions — ${order.order_number}`}>
            <Head title={`Transactions — ${order.order_number}`} />

            <div className="mb-6 flex items-center gap-3">
                <Link href={route('admin.orders.show', order.id)} className="text-sm text-ink-500 hover:text-ink-900">
                    ← {order.order_number}
                </Link>
                <h1 className="text-xl font-bold text-ink-900">Transaction History</h1>
            </div>

            {payments.length === 0 ? (
                <div className="rounded-xl border border-ink-200 bg-surface p-8 text-center text-sm text-ink-500">
                    No payment transactions recorded for this order.
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-ink-200 bg-surface">
                    <table className="w-full text-sm">
                        <thead className="border-b border-ink-200 bg-ink-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-ink-500">Type</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-ink-500">Gateway</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-ink-500">Method</th>
                                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-ink-500">Amount</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-ink-500">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-ink-500">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-ink-100">
                            {payments.map((p) => (
                                <tr key={p.id} className="hover:bg-ink-50">
                                    <td className="px-4 py-3 font-medium text-ink-900">
                                        {typeLabel[p.type] ?? p.type}
                                    </td>
                                    <td className="px-4 py-3 capitalize text-ink-600">{p.gateway}</td>
                                    <td className="px-4 py-3 capitalize text-ink-600">{p.method ?? '—'}</td>
                                    <td className="px-4 py-3 text-right font-medium text-ink-900">
                                        {p.type === 'refund' ? (
                                            <span className="text-red-600">−{formatPrice(p.amount_cents)}</span>
                                        ) : formatPrice(p.amount_cents)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColor[p.status] ?? 'bg-ink-100 text-ink-700'}`}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-ink-500">
                                        {formatDate(p.captured_at ?? p.refunded_at ?? p.failed_at)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="border-t border-ink-200 bg-ink-50">
                            <tr>
                                <td colSpan={3} className="px-4 py-3 text-xs font-medium text-ink-500 uppercase tracking-wide">
                                    Order total
                                </td>
                                <td className="px-4 py-3 text-right font-bold text-ink-900">
                                    {formatPrice(order.total_cents)}
                                </td>
                                <td colSpan={2} />
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </AdminLayout>
    );
}
