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
    pending: 'text-yellow-400 bg-yellow-900/30',
    awaiting_payment: 'text-yellow-400 bg-yellow-900/30',
    paid: 'text-green-400 bg-green-900/30',
    processing: 'text-blue-400 bg-blue-900/30',
    shipped: 'text-blue-400 bg-blue-900/30',
    delivered: 'text-green-400 bg-green-900/30',
    cancelled: 'text-red-400 bg-red-900/30',
    refunded: 'text-red-400 bg-red-900/30',
    partially_refunded: 'text-orange-400 bg-orange-900/30',
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
                        className="rounded-lg bg-ink-800 border border-ink-700 px-3 py-1.5 text-sm text-white placeholder-ink-500 focus:border-[#e7901d] focus:outline-none w-52"
                    />
                    <button type="submit" className="rounded-lg bg-ink-700 px-3 py-1.5 text-sm text-white hover:bg-ink-600">Search</button>
                </form>
                <select
                    value={filters.status ?? ''}
                    onChange={(e) => router.get(route('admin.orders.index'), { search: filters.search, status: e.target.value || undefined }, { preserveState: true })}
                    className="rounded-lg bg-ink-800 border border-ink-700 px-3 py-1.5 text-sm text-white focus:outline-none"
                >
                    <option value="">All statuses</option>
                    {statuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
            </div>

            <div className="overflow-hidden rounded-xl border border-ink-800 bg-ink-900">
                <table className="w-full text-sm">
                    <thead className="border-b border-ink-800 bg-ink-950">
                        <tr>
                            {['Order #', 'Customer', 'Status', 'Items', 'Total', 'Date', ''].map((h) => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-ink-400 uppercase">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-800">
                        {orders.data.map((o) => (
                            <tr key={o.id} className="hover:bg-ink-800/50">
                                <td className="px-4 py-3 font-mono text-xs text-[#e7901d]">{o.order_number}</td>
                                <td className="px-4 py-3">
                                    <p className="text-white text-xs font-medium">{o.user.name}</p>
                                    <p className="text-ink-400 text-xs">{o.user.email}</p>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[o.status] ?? 'text-ink-400 bg-ink-800'}`}>
                                        {o.status_label}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-ink-300 text-xs">{o.items_count}</td>
                                <td className="px-4 py-3 text-white text-xs font-medium">{formatPHP(o.total_cents)}</td>
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

            {/* Pagination */}
            <div className="mt-4 flex gap-1">
                {orders.links.map((l, i) => (
                    <button
                        key={i}
                        disabled={!l.url}
                        onClick={() => l.url && router.get(l.url)}
                        className={`rounded px-3 py-1.5 text-xs ${l.active ? 'bg-[#e7901d] text-white' : l.url ? 'bg-ink-800 text-ink-300 hover:bg-ink-700' : 'bg-ink-900 text-ink-600 cursor-not-allowed'}`}
                        dangerouslySetInnerHTML={{ __html: l.label }}
                    />
                ))}
            </div>
        </AdminLayout>
    );
}
