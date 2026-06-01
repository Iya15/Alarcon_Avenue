import AdminLayout from '@/Components/layout/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import type { PageProps } from '@/types';

interface Order {
    id: number; order_number: string; status: string; status_label: string;
    total_cents: number; items_count: number; paid_at: string | null; created_at: string;
    user: { id: number | null; name: string; email: string };
}

interface Props extends PageProps {
    orders: { data: Order[]; links: { url: string | null; label: string; active: boolean }[] };
    filters: { search?: string; status?: string };
    statuses: { value: string; label: string }[];
}

const STATUS_COLORS: Record<string, string> = {
    pending:            'text-yellow-700 bg-yellow-100',
    awaiting_payment:   'text-yellow-700 bg-yellow-100',
    paid:               'text-green-700 bg-green-100',
    processing:         'text-blue-700 bg-blue-100',
    shipped:            'text-blue-700 bg-blue-100',
    delivered:          'text-green-700 bg-green-100',
    cancelled:          'text-red-700 bg-red-100',
    refunded:           'text-red-700 bg-red-100',
    partially_refunded: 'text-orange-700 bg-orange-100',
};

function formatPHP(cents: number) {
    return `₱${(cents / 100).toLocaleString('en-PH')}`;
}

export default function AdminOrdersIndex({ orders, filters, statuses }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const applySearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.orders.index'), { search, status: filters.status }, { preserveState: true });
    };

    return (
        <AdminLayout title="Orders">
            <Head title="Orders — Admin" />
            <div className="mb-5 flex flex-wrap items-center gap-3">
                <form onSubmit={applySearch} className="flex gap-2">
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Order # or email…"
                        className="rounded-lg bg-surface border border-ink-200 px-3 py-1.5 text-sm text-ink-900 placeholder-ink-400 focus:border-[#e7901d] focus:outline-none w-52"
                    />
                    <button type="submit" className="rounded-lg bg-ink-900 px-3 py-1.5 text-sm text-ink-50 hover:bg-ink-800">Search</button>
                </form>
                <select
                    value={filters.status ?? ''}
                    onChange={(e) => router.get(route('admin.orders.index'), { search: filters.search, status: e.target.value || undefined }, { preserveState: true })}
                    className="rounded-lg bg-surface border border-ink-200 px-3 py-1.5 text-sm text-ink-900 focus:outline-none"
                >
                    <option value="">All statuses</option>
                    {statuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
            </div>

            <div className="overflow-hidden rounded-xl border border-ink-200 bg-surface">
                <table className="w-full text-sm">
                    <thead className="border-b border-ink-200 bg-canvas">
                        <tr>
                            {['Order #', 'Customer', 'Status', 'Items', 'Total', 'Date', ''].map((h) => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-ink-500 uppercase">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-200">
                        {orders.data.map((o) => (
                            <tr key={o.id} className="hover:bg-ink-50">
                                <td className="px-4 py-3 font-mono text-xs text-[#e7901d]">{o.order_number}</td>
                                <td className="px-4 py-3">
                                    <p className="text-ink-900 text-xs font-medium">{o.user.name}</p>
                                    <p className="text-ink-400 text-xs">{o.user.email}</p>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[o.status] ?? 'text-ink-600 bg-ink-100'}`}>
                                        {o.status_label}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-ink-500 text-xs">{o.items_count}</td>
                                <td className="px-4 py-3 text-ink-900 text-xs font-medium">{formatPHP(o.total_cents)}</td>
                                <td className="px-4 py-3 text-ink-400 text-xs">{o.created_at ? new Date(o.created_at).toLocaleDateString('en-PH') : '—'}</td>
                                <td className="px-4 py-3 text-right">
                                    <Link href={route('admin.orders.show', o.id)} className="text-xs text-[#e7901d] hover:underline">View</Link>
                                </td>
                            </tr>
                        ))}
                        {orders.data.length === 0 && (
                            <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-ink-500">No orders found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 flex gap-1">
                {orders.links.map((l, i) => (
                    <button
                        key={i}
                        disabled={!l.url}
                        onClick={() => l.url && router.get(l.url)}
                        className={`rounded px-3 py-1.5 text-xs ${l.active ? 'bg-[#e7901d] text-white' : l.url ? 'bg-ink-100 text-ink-700 hover:bg-ink-200' : 'bg-canvas text-ink-400 cursor-not-allowed'}`}
                        dangerouslySetInnerHTML={{ __html: l.label }}
                    />
                ))}
            </div>
        </AdminLayout>
    );
}
