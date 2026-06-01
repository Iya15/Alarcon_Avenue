import AdminLayout from '@/Components/layout/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import type { PageProps } from '@/types';

interface Variant {
    id: number; sku: string; product_id: number; product_name: string; product_slug: string;
    quantity: number; reserved: number; available: number; is_low_stock: boolean; threshold: number;
}

interface Props extends PageProps {
    variants: { data: Variant[]; links: { url: string | null; label: string; active: boolean }[] };
    filters: { low_stock?: string; search?: string };
    low_stock_count: number;
}

export default function AdminInventoryIndex({ variants, filters, low_stock_count }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const applySearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.inventory.index'), { search, low_stock: filters.low_stock }, { preserveState: true });
    };

    return (
        <AdminLayout title="Inventory">
            <Head title="Inventory — Admin" />

            <div className="mb-5 flex flex-wrap items-center gap-3">
                <form onSubmit={applySearch} className="flex gap-2">
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="SKU or product name…"
                        className="rounded-lg bg-surface border border-ink-200 px-3 py-1.5 text-sm text-ink-900 placeholder-ink-400 focus:border-[#e7901d] focus:outline-none w-52"
                    />
                    <button type="submit" className="rounded-lg bg-ink-900 px-3 py-1.5 text-sm text-ink-50 hover:bg-ink-800">Search</button>
                </form>
                <button
                    onClick={() => router.get(route('admin.inventory.index'), { low_stock: filters.low_stock ? undefined : '1', search: filters.search }, { preserveState: true })}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${filters.low_stock ? 'bg-[#e7901d] text-white' : 'bg-ink-100 text-ink-700 hover:bg-ink-200'}`}
                >
                    Low Stock ({low_stock_count})
                </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-ink-200 bg-surface">
                <table className="w-full text-sm">
                    <thead className="border-b border-ink-200 bg-canvas">
                        <tr>
                            {['SKU', 'Product', 'Quantity', 'Reserved', 'Available', 'Threshold', 'Actions'].map((h) => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-ink-500 uppercase">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-200">
                        {variants.data.map((v) => (
                            <tr key={v.id} className={v.is_low_stock ? 'bg-red-50' : 'hover:bg-ink-50'}>
                                <td className="px-4 py-3 font-mono text-xs text-ink-600">{v.sku}</td>
                                <td className="px-4 py-3">
                                    <Link href={route('admin.products.edit', v.product_id)} className="text-ink-900 text-xs hover:text-[#e7901d]">
                                        {v.product_name}
                                    </Link>
                                </td>
                                <td className="px-4 py-3 text-ink-500 text-xs">{v.quantity}</td>
                                <td className="px-4 py-3 text-ink-500 text-xs">{v.reserved}</td>
                                <td className="px-4 py-3 text-xs">
                                    <span className={v.is_low_stock ? 'text-red-600 font-semibold' : 'text-green-600'}>
                                        {v.available}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-ink-400 text-xs">{v.threshold}</td>
                                <td className="px-4 py-3">
                                    <Link href={route('admin.products.edit', v.product_id)} className="text-xs text-[#e7901d] hover:underline">Edit</Link>
                                </td>
                            </tr>
                        ))}
                        {variants.data.length === 0 && (
                            <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-ink-500">No variants found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 flex gap-1">
                {variants.links.map((l, i) => (
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
