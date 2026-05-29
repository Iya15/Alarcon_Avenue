import Button from '@/Components/ui/Button';
import Card from '@/Components/ui/Card';
import Checkbox from '@/Components/ui/Checkbox';
import Input from '@/Components/ui/Input';
import Select from '@/Components/ui/Select';
import Container from '@/Components/layout/Container';
import type { PageProps } from '@/types';
import { Head, useForm } from '@inertiajs/react';

interface Category { id: number; name: string }
interface EditCategory { id: number; name: string; slug: string; description: string | null; parent_id: number | null; sort_order: number; is_active: boolean; image_url: string | null }

interface Props extends PageProps {
    category?: EditCategory;
    parents: { data: Category[] };
}

export default function AdminCategoryForm({ category, parents }: Props) {
    const isEditing = !!category;

    const { data, setData, post, put, processing, errors } = useForm({
        name:        category?.name ?? '',
        slug:        category?.slug ?? '',
        parent_id:   category?.parent_id?.toString() ?? '',
        description: category?.description ?? '',
        sort_order:  category?.sort_order ?? 0,
        is_active:   category?.is_active ?? true,
        image:       null as File | null,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const method = isEditing
            ? put(route('admin.categories.update', category!.id), { forceFormData: true })
            : post(route('admin.categories.store'), { forceFormData: true });
    };

    return (
        <>
            <Head title={isEditing ? `Edit ${category!.name}` : 'New Category'} />
            <Container size="md" className="py-8">
                <h1 className="mb-6 text-2xl font-bold tracking-tight text-ink-950">
                    {isEditing ? `Edit "${category!.name}"` : 'New Category'}
                </h1>

                <form onSubmit={submit}>
                    <Card bordered className="space-y-5">
                        <Input label="Name" value={data.name} onChange={(e) => setData('name', e.target.value)} error={errors.name} required />
                        <Input label="Slug" value={data.slug} onChange={(e) => setData('slug', e.target.value)} hint="Leave blank to auto-generate from name." error={errors.slug} />

                        <Select
                            label="Parent category"
                            value={data.parent_id}
                            onChange={(e) => setData('parent_id', e.target.value)}
                            options={parents.data.map((p) => ({ value: p.id, label: p.name }))}
                            placeholder="None (root category)"
                            error={errors.parent_id}
                        />

                        <div>
                            <label className="text-sm font-medium text-ink-800">Description</label>
                            <textarea
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                rows={3}
                                className="mt-1.5 w-full rounded-lg border border-ink-200 bg-surface px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                        </div>

                        <Input
                            label="Sort order"
                            type="number"
                            value={data.sort_order}
                            onChange={(e) => setData('sort_order', parseInt(e.target.value))}
                            error={errors.sort_order}
                        />

                        <div>
                            <label className="block text-sm font-medium text-ink-800 mb-1.5">Category image</label>
                            {category?.image_url && (
                                <img src={category.image_url} alt={category.name} className="mb-2 h-24 w-24 rounded-lg object-cover" />
                            )}
                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={(e) => setData('image', e.target.files?.[0] ?? null)}
                                className="text-sm text-ink-600"
                            />
                            {errors.image && <p className="mt-1 text-xs text-danger-600">{errors.image}</p>}
                        </div>

                        <Checkbox
                            label="Active"
                            description="Active categories are visible to shoppers."
                            checked={data.is_active}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData('is_active', e.target.checked)}
                        />

                        <div className="flex gap-3 pt-2">
                            <Button type="submit" loading={processing}>{isEditing ? 'Update' : 'Create'} category</Button>
                            <Button variant="secondary" href={route('admin.categories.index')}>Cancel</Button>
                        </div>
                    </Card>
                </form>
            </Container>
        </>
    );
}
