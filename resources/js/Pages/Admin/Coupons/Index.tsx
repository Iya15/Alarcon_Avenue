import AdminLayout from '@/Components/layout/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import type { PageProps } from '@/types';

interface Coupon {
    id: number; code: string; discount_type: string; discount_value: number;
    used_count: number; usages_count: number; max_uses: number | null;
    is_active: boolean; is_valid: boolean; expires_at: string | null; created_at: string;
}

interface Props extends PageProps {
    coupons: { data: Coupon[]; links: { url: string | null; label: string; active: boolean }[] };
    filters: { search?: string };
}

function formatDiscount(c: Coupon) {
    if (c.discount_type === 'percent')       return `${c.discount_value}%`;
    if (c.discount_type === 'fixed')         return `₱${(c.discount_value / 100).toLocaleString('en-PH')}`;
    if (c.discount_type === 'free_shipping') return 'Free shipping';
    return c.discount_value;
}

export default function AdminCouponsIndex({ coupons, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const applySearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.coupons.index'), { search }, { preserveState: true });
    };

    const destroy = (id: number, code: string) => {
        if (confirm(`Delete coupon "${code}"?`)) router.delete(route('admin.coupons.destroy', id));
    };

    return (
        <AdminLayout title="Coupons">
            <Head title="Coupons — Admin" />
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <form onSubmit={applySearch} className="flex gap-2">
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Code…"
                        className="rounded-lg bg-ink-800 border border-ink-700 px-3 py-1.5 text-sm text-white placeholder-ink-500 focus:border-[#e7901d] focus:outline-none w-40" />
                    <button type="submit" className="rounded-lg bg-ink-700 px-3 py-1.5 text-sm text-white hover:bg-ink-600">Search</button>
                </form>
                <Link href={route('admin.coupons.create')} className="rounded-lg bg-[#e7901d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#c97a18]">
                    Add coupon
                </Link>
            </div>

            <div className="overflow-hidden rounded-xl border border-ink-800 bg-ink-900">
                <table className="w-full text-sm">
                    <thead className="border-b border-ink-800 bg-ink-950">
                        <tr>
                            {['Code', 'Discount', 'Used / Max', 'Expires', 'Status', 'Actions'].map((h) => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-ink-400 uppercase">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-800">
                        {coupons.data.map((c) => (
                            <tr key={c.id} className="hover:bg-ink-800/50">
                                <td className="px-4 py-3 font-mono text-xs text-[#e7901d]">{c.code}</td>
                                <td className="px-4 py-3 text-xs text-white">{formatDiscount(c)}</td>
                                <td className="px-4 py-3 text-xs text-ink-300">{c.used_count} / {c.max_uses ?? '∞'}</td>
                                <td className="px-4 py-3 text-xs text-ink-400">{c.expires_at ? new Date(c.expires_at).toLocaleDateString('en-PH') : '—'}</td>
                                <td className="px-4 py-3 text-xs">
                                    <span className={`font-medium ${c.is_valid ? 'text-green-400' : 'text-red-400'}`}>
                                        {c.is_valid ? 'Valid' : 'Invalid'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 flex gap-3 text-xs">
                                    <Link href={route('admin.coupons.edit', c.id)} className="text-[#e7901d] hover:underline">Edit</Link>
                                    <button onClick={() => destroy(c.id, c.code)} className="text-red-400 hover:underline">Delete</button>
                                </td>
                            </tr>
                        ))}
                        {coupons.data.length === 0 && (
                            <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-ink-500">No coupons found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 flex gap-1">
                {coupons.links.map((l, i) => (
                    <button key={i} disabled={!l.url} onClick={() => l.url && router.get(l.url)}
                        className={`rounded px-3 py-1.5 text-xs ${l.active ? 'bg-[#e7901d] text-white' : l.url ? 'bg-ink-800 text-ink-300 hover:bg-ink-700' : 'bg-ink-900 text-ink-600 cursor-not-allowed'}`}
                        dangerouslySetInnerHTML={{ __html: l.label }} />
                ))}
            </div>
        </AdminLayout>
    );
}
