import Badge from '@/Components/ui/Badge';
import Button from '@/Components/ui/Button';
import Card from '@/Components/ui/Card';
import Input from '@/Components/ui/Input';
import AdminLayout from '@/Components/layout/AdminLayout';
import type { PageProps } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

interface ProductImage { url: string }
interface Category { name: string }
interface Product {
    id: number; name: string; slug: string; status: string; is_featured: boolean;
    base_price_cents: number; deleted_at: string | null;
    primary_image: ProductImage | null; categories: Category[];
    variants_count: number;
}
interface Props extends PageProps {
    products: { data: Product[]; links: { url: string | null; label: string; active: boolean }[]; meta: { total: number } };
    filters: { search?: string; status?: string };
}

function formatPrice(cents: number) {
    return `₱${(cents / 100).toLocaleString('en-PH')}`;
}

const statusBadge: Record<string, 'success' | 'subtle' | 'default' | 'inverted'> = {
    active: 'success', draft: 'subtle', archived: 'inverted',
};

export default function AdminProductsIndex({ products, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const applySearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.products.index'), { search, status: filters.status }, { preserveState: true });
    };

    const destroy = (id: number, name: string) => {
        if (confirm(`Archive "${name}"? It can be restored later.`)) router.delete(route('admin.products.destroy', id));
    };

    const restore = (id: number) => router.post(route('admin.products.restore', id));

    return (
        <AdminLayout title="Products">
            <Head title="Products — Admin" />
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-lg font-bold text-ink-900">Products ({products.meta.total})</h1>
                    <Button href={route('admin.products.create')}>Add product</Button>
                </div>

                <form onSubmit={applySearch} className="mb-4 flex gap-2">
                    <Input placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
                    <Button type="submit" variant="secondary" size="sm">Search</Button>
                    {filters.search && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => { setSearch(''); router.get(route('admin.products.index')); }}>
                            Clear
                        </Button>
                    )}
                </form>

                <Card bordered padding="none">
                    <table className="w-full text-sm">
                        <thead className="border-b border-ink-200 bg-ink-50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-ink-600">Product</th>
                                <th className="hidden px-4 py-3 text-left font-medium text-ink-600 sm:table-cell">Price</th>
                                <th className="hidden px-4 py-3 text-left font-medium text-ink-600 md:table-cell">Status</th>
                                <th className="hidden px-4 py-3 text-left font-medium text-ink-600 lg:table-cell">Variants</th>
                                <th className="px-4 py-3 text-right font-medium text-ink-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-ink-100">
                            {products.data.map((product) => (
                                <tr key={product.id} className={`hover:bg-ink-50 ${product.deleted_at ? 'opacity-50' : ''}`}>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                                                {product.primary_image && (
                                                    <img src={product.primary_image.url} alt={product.name} className="h-full w-full object-cover" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-ink-900 leading-tight">{product.name}</p>
                                                <p className="text-xs text-ink-400">{product.categories.map(c => c.name).join(', ')}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="hidden px-4 py-3 text-ink-700 sm:table-cell">{formatPrice(product.base_price_cents)}</td>
                                    <td className="hidden px-4 py-3 md:table-cell">
                                        <Badge variant={statusBadge[product.status] ?? 'default'} dot size="sm">
                                            {product.status}
                                        </Badge>
                                        {product.deleted_at && <Badge variant="inverted" size="sm" className="ml-1">Archived</Badge>}
                                    </td>
                                    <td className="hidden px-4 py-3 text-ink-500 lg:table-cell">{product.variants_count}</td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            {product.deleted_at ? (
                                                <button onClick={() => restore(product.id)} className="text-xs text-brand-600 hover:text-brand-700">Restore</button>
                                            ) : (
                                                <>
                                                    <Link href={route('admin.products.edit', product.id)} className="text-xs text-brand-600 hover:text-brand-700">Edit</Link>
                                                    <button onClick={() => destroy(product.id, product.name)} className="text-xs text-danger-600 hover:text-danger-700">Archive</button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>

                {products.links.length > 3 && (
                    <div className="mt-6 flex items-center justify-center gap-1">
                        {products.links.map((link, i) => (
                            link.url ? (
                                <Link key={i} href={link.url} className={`flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2 text-xs ${link.active ? 'bg-brand-500 text-white' : 'border border-ink-200 text-ink-700 hover:bg-ink-50'}`} dangerouslySetInnerHTML={{ __html: link.label }} />
                            ) : (
                                <span key={i} className="flex h-8 min-w-[2rem] items-center justify-center px-2 text-xs text-ink-300" dangerouslySetInnerHTML={{ __html: link.label }} />
                            )
                        ))}
                    </div>
                )}
        </AdminLayout>
    );
}
