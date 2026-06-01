import Badge from '@/Components/ui/Badge';
import Button from '@/Components/ui/Button';
import Card from '@/Components/ui/Card';
import AdminLayout from '@/Components/layout/AdminLayout';
import type { PageProps } from '@/types';
import { Head, Link, router } from '@inertiajs/react';

interface Category {
    id: number; name: string; slug: string;
    is_active: boolean; sort_order: number;
    parent: { id: number; name: string } | null;
    product_count?: number;
}

interface Props extends PageProps {
    categories: { data: Category[] };
}

export default function AdminCategoriesIndex({ categories }: Props) {
    const destroy = (id: number, name: string) => {
        if (confirm(`Delete "${name}"? Its children will be moved up.`)) {
            router.delete(route('admin.categories.destroy', id));
        }
    };

    return (
        <AdminLayout title="Categories">
            <Head title="Categories — Admin" />
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-lg font-bold text-ink-900">Categories</h1>
                    <Button href={route('admin.categories.create')}>Add category</Button>
                </div>

                <Card bordered padding="none">
                    <table className="w-full text-sm">
                        <thead className="border-b border-ink-200 bg-ink-50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-ink-600">Name</th>
                                <th className="px-4 py-3 text-left font-medium text-ink-600">Parent</th>
                                <th className="px-4 py-3 text-left font-medium text-ink-600">Status</th>
                                <th className="px-4 py-3 text-right font-medium text-ink-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-ink-100">
                            {categories.data.map((cat) => (
                                <tr key={cat.id} className="hover:bg-ink-50">
                                    <td className="px-4 py-3 font-medium text-ink-900">{cat.name}</td>
                                    <td className="px-4 py-3 text-ink-500">{cat.parent?.name ?? '—'}</td>
                                    <td className="px-4 py-3">
                                        <Badge variant={cat.is_active ? 'success' : 'subtle'} dot>
                                            {cat.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link href={route('admin.categories.edit', cat.id)} className="text-xs text-brand-600 hover:text-brand-700">Edit</Link>
                                            <button onClick={() => destroy(cat.id, cat.name)} className="text-xs text-danger-600 hover:text-danger-700">Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
        </AdminLayout>
    );
}
