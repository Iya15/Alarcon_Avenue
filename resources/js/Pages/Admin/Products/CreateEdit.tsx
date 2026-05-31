import Badge from '@/Components/ui/Badge';
import Button from '@/Components/ui/Button';
import Card from '@/Components/ui/Card';
import Checkbox from '@/Components/ui/Checkbox';
import Input from '@/Components/ui/Input';
import Modal from '@/Components/ui/Modal';
import Select from '@/Components/ui/Select';
import AdminLayout from '@/Components/layout/AdminLayout';
import type { PageProps } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

interface Category { id: number; name: string }
interface AttrValue { id: number; value: string; display_value: string; attribute_id: number }
interface Attribute { id: number; display_name: string; values: AttrValue[] }
interface ProductImage { id: number; url: string; is_primary: boolean; sort_order: number }
interface Variant { id: number; sku: string; is_active: boolean; effective_price: number; attribute_values: AttrValue[]; inventory: { available: number; quantity: number } | null }
interface Product {
    id: number; name: string; slug: string; description: string | null; short_description: string | null;
    base_price_cents: number; compare_at_price_cents: number | null; cost_price_cents: number | null;
    status: string; is_featured: boolean; meta_title: string | null; meta_description: string | null;
    categories: Category[]; images: ProductImage[]; variants: Variant[];
}

interface Props extends PageProps {
    product?: Product;
    categories: { data: Category[] };
    attributes: { data: Attribute[] };
}

function formatPrice(cents: number) {
    return `₱${(cents / 100).toLocaleString('en-PH')}`;
}

export default function AdminProductForm({ product, categories, attributes }: Props) {
    const isEditing = !!product;
    const [addVariantOpen, setAddVariantOpen] = useState(false);
    const [uploadOpen, setUploadOpen] = useState(false);
    const { flash } = usePage<PageProps>().props;
    const imagesRef = useRef<HTMLDivElement>(null);

    // After creating a product, scroll to the images section automatically
    useEffect(() => {
        if (flash?.success && isEditing && imagesRef.current) {
            setTimeout(() => imagesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
        }
    }, []); // eslint-disable-line

    const { data, setData, post, put, processing, errors } = useForm<{
        name: string; slug: string; description: string; short_description: string;
        base_price_cents: number; compare_at_price_cents: number | string;
        cost_price_cents: number | string; status: string; is_featured: boolean;
        meta_title: string; meta_description: string; category_ids: number[];
        images: File[];
    }>({
        name:                   product?.name ?? '',
        slug:                   product?.slug ?? '',
        description:            product?.description ?? '',
        short_description:      product?.short_description ?? '',
        base_price_cents:       product?.base_price_cents ?? 0,
        compare_at_price_cents: product?.compare_at_price_cents ?? '',
        cost_price_cents:       product?.cost_price_cents ?? '',
        status:                 product?.status ?? 'draft',
        is_featured:            product?.is_featured ?? false,
        meta_title:             product?.meta_title ?? '',
        meta_description:       product?.meta_description ?? '',
        category_ids:           product?.categories?.map((c: { id: number }) => c.id) ?? [],
        images:                 [],
    });

    // Preview URLs for selected files (create form only)
    const [previews, setPreviews] = useState<string[]>([]);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        setData('images', files);
        setPreviews(files.map((f) => URL.createObjectURL(f)));
    };

    const [formErrors, setFormErrors] = useState<string[]>([]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const errs: string[] = [];
        if (!data.name.trim()) errs.push('Product name is required.');
        if (data.base_price_cents <= 0) errs.push('Base price must be greater than ₱0.');
        if (errs.length) { setFormErrors(errs); return; }
        setFormErrors([]);
        if (isEditing) put(route('admin.products.update', product!.id));
        else post(route('admin.products.store'), { forceFormData: true });
    };

    const destroyImage = (imageId: number) => {
        if (confirm('Delete this image?')) router.delete(route('admin.product-images.destroy', imageId));
    };

    const setPrimary = (imageId: number) => {
        router.patch(route('admin.product-images.primary', imageId));
    };

    return (
        <AdminLayout title={isEditing ? `Edit ${product!.name}` : 'New Product'}>
            <Head title={isEditing ? `Edit ${product!.name}` : 'New Product — Admin'} />
                <div className="mb-6 flex items-center gap-4">
                    <Link href={route('admin.products.index')} className="text-sm text-ink-500 hover:text-ink-900">← Products</Link>
                    <h1 className="text-2xl font-bold tracking-tight text-ink-950">
                        {isEditing ? product!.name : 'New Product'}
                    </h1>
                </div>

                {flash?.success && (
                    <div className="mb-6 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                        <svg className="h-4 w-4 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {flash.success}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <form onSubmit={submit} className="lg:col-span-2 space-y-4">
                        <Card bordered>
                            <h2 className="mb-4 font-semibold text-ink-900">Basic info</h2>
                            <div className="space-y-4">
                                <Input label="Product name" value={data.name} onChange={(e) => setData('name', e.target.value)} error={errors.name} required />
                                <Input label="Slug" value={data.slug} onChange={(e) => setData('slug', e.target.value)} hint="Auto-generated if blank." error={errors.slug} />
                                <div>
                                    <label className="text-sm font-medium text-ink-800">Description</label>
                                    <textarea value={data.description} onChange={(e) => setData('description', e.target.value)} rows={6} className="mt-1.5 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500" />
                                </div>
                                <Input label="Short description" value={data.short_description} onChange={(e) => setData('short_description', e.target.value)} hint="Shown on listing cards." error={errors.short_description} />
                            </div>
                        </Card>

                        <Card bordered>
                            <h2 className="mb-4 font-semibold text-ink-900">Pricing</h2>
                            <div className="grid grid-cols-3 gap-4">
                                <Input label="Base price (₱)" type="number" value={data.base_price_cents / 100} onChange={(e) => setData('base_price_cents', Math.round(parseFloat(e.target.value) * 100) || 0)} error={errors.base_price_cents} />
                                <Input label="Compare at (₱)" type="number" value={data.compare_at_price_cents ? +data.compare_at_price_cents / 100 : ''} onChange={(e) => setData('compare_at_price_cents', e.target.value ? Math.round(parseFloat(e.target.value) * 100) : '')} hint="Strike-through price" />
                                <Input label="Cost (₱)" type="number" value={data.cost_price_cents ? +data.cost_price_cents / 100 : ''} onChange={(e) => setData('cost_price_cents', e.target.value ? Math.round(parseFloat(e.target.value) * 100) : '')} hint="Internal only" />
                            </div>
                        </Card>

                        <Card bordered>
                            <h2 className="mb-4 font-semibold text-ink-900">SEO</h2>
                            <div className="space-y-3">
                                <Input label="Meta title" value={data.meta_title} onChange={(e) => setData('meta_title', e.target.value)} hint="Default: product name" />
                                <Input label="Meta description" value={data.meta_description} onChange={(e) => setData('meta_description', e.target.value)} />
                            </div>
                        </Card>

                        {formErrors.length > 0 && (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                                <p className="mb-1 text-sm font-medium text-red-700">Please fix the following:</p>
                                <ul className="list-inside list-disc space-y-0.5 text-sm text-red-600">
                                    {formErrors.map((e) => <li key={e}>{e}</li>)}
                                </ul>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <Button type="submit" loading={processing}>{isEditing ? 'Save changes' : 'Create product'}</Button>
                            <Button variant="secondary" href={route('admin.products.index')}>Cancel</Button>
                        </div>
                    </form>

                    <div className="space-y-4">
                        <Card bordered>
                            <h2 className="mb-3 font-semibold text-ink-900">Status</h2>
                            <Select label="Status" value={data.status} onChange={(e) => setData('status', e.target.value)} options={[
                                { value: 'draft', label: 'Draft' },
                                { value: 'active', label: 'Active' },
                                { value: 'archived', label: 'Archived' },
                            ]} />
                            <div className="mt-3">
                                <Checkbox label="Featured" description="Show in featured sections" checked={data.is_featured} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData('is_featured', e.target.checked)} />
                            </div>
                        </Card>

                        <Card bordered>
                            <h2 className="mb-3 font-semibold text-ink-900">Categories</h2>
                            <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                {categories.data.map((cat) => (
                                    <Checkbox
                                        key={cat.id}
                                        label={cat.name}
                                        checked={data.category_ids.includes(cat.id)}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            setData('category_ids', e.target.checked
                                                ? [...data.category_ids, cat.id]
                                                : data.category_ids.filter(id => id !== cat.id)
                                            );
                                        }}
                                    />
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Inline image upload — available on the create form before saving */}
                {!isEditing && (
                    <div className="mt-6">
                        <Card bordered>
                            <h2 className="mb-3 font-semibold text-ink-900">Product Images</h2>
                            <p className="mb-4 text-sm text-ink-500">
                                Select images to upload with this product. Accepted: JPG, PNG, WebP, AVIF — max 8 MB each.
                            </p>

                            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink-200 bg-ink-50 py-8 text-center transition hover:border-brand hover:bg-brand/5">
                                <svg className="h-8 w-8 text-ink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                </svg>
                                <span className="text-sm font-medium text-ink-600">Click to select images</span>
                                <span className="text-xs text-ink-400">or drag and drop</span>
                                <input
                                    type="file"
                                    multiple
                                    accept=".jpg,.jpeg,.png,.webp,.avif"
                                    className="sr-only"
                                    onChange={handleImageSelect}
                                />
                            </label>

                            {previews.length > 0 && (
                                <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6">
                                    {previews.map((src, i) => (
                                        <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-ink-200">
                                            <img src={src} alt={`Preview ${i + 1}`} className="h-full w-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newFiles = data.images.filter((_, j) => j !== i);
                                                    setData('images', newFiles);
                                                    setPreviews((p) => p.filter((_, j) => j !== i));
                                                }}
                                                className="absolute inset-0 hidden items-center justify-center bg-black/50 group-hover:flex"
                                            >
                                                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                            {i === 0 && (
                                                <span className="absolute left-1 top-1 rounded-full bg-brand px-1.5 py-0.5 text-[9px] font-semibold text-white">Primary</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {data.images.length > 0 && (
                                <p className="mt-3 text-xs text-ink-500">
                                    {data.images.length} image{data.images.length !== 1 ? 's' : ''} selected. First image will be set as primary.
                                </p>
                            )}
                        </Card>
                    </div>
                )}

                {/* Images section — only shown when editing */}
                {isEditing && (
                    <div className="mt-6" ref={imagesRef}>
                        <Card bordered>
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="font-semibold text-ink-900">Images</h2>
                                <Button size="sm" variant="secondary" onClick={() => setUploadOpen(true)}>Upload images</Button>
                            </div>
                            {(product?.images ?? []).length === 0 ? (
                                <p className="text-sm text-ink-500">No images yet. Upload at least one image.</p>
                            ) : (
                                <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-8">
                                    {(product?.images ?? []).map((img) => (
                                        <div key={img.id} className="group relative">
                                            <div className={`aspect-square overflow-hidden rounded-lg border-2 ${img.is_primary ? 'border-brand-500' : 'border-transparent'}`}>
                                                <img src={img.url} alt="" className="h-full w-full object-cover" />
                                            </div>
                                            <div className="absolute inset-0 hidden flex-col items-center justify-center gap-1 rounded-lg bg-black/50 group-hover:flex">
                                                {!img.is_primary && (
                                                    <button onClick={() => setPrimary(img.id)} className="text-[10px] text-white hover:underline">Set primary</button>
                                                )}
                                                <button onClick={() => destroyImage(img.id)} className="text-[10px] text-danger-400 hover:underline">Delete</button>
                                            </div>
                                            {img.is_primary && (
                                                <span className="absolute -top-1 -right-1 rounded-full bg-brand-500 px-1 text-[9px] text-white">★</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>

                        <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} productId={product!.id} />
                    </div>
                )}

                {/* Variants section — only shown when editing */}
                {isEditing && (
                    <div className="mt-6">
                        <Card bordered>
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="font-semibold text-ink-900">Variants</h2>
                                <Button size="sm" variant="secondary" onClick={() => setAddVariantOpen(true)}>Add variant</Button>
                            </div>
                            <table className="w-full text-sm">
                                <thead className="border-b border-ink-200">
                                    <tr>
                                        <th className="pb-2 text-left text-xs font-medium text-ink-500">SKU</th>
                                        <th className="pb-2 text-left text-xs font-medium text-ink-500">Options</th>
                                        <th className="pb-2 text-left text-xs font-medium text-ink-500">Price</th>
                                        <th className="pb-2 text-left text-xs font-medium text-ink-500">Stock</th>
                                        <th className="pb-2 text-right text-xs font-medium text-ink-500">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-ink-100">
                                    {(product?.variants ?? []).map((v) => (
                                        <tr key={v.id}>
                                            <td className="py-2 font-mono text-xs text-ink-700">{v.sku}</td>
                                            <td className="py-2">
                                                {v.attribute_values.map((av) => (
                                                    <Badge key={av.id} variant="subtle" size="sm" className="mr-1">{av.display_value}</Badge>
                                                ))}
                                            </td>
                                            <td className="py-2 text-ink-700">{formatPrice(v.effective_price)}</td>
                                            <td className="py-2">
                                                <span className={v.inventory && v.inventory.available > 0 ? 'text-success-600' : 'text-danger-600'}>
                                                    {v.inventory?.available ?? 0}
                                                </span>
                                            </td>
                                            <td className="py-2 text-right">
                                                <InventoryInline variantId={v.id} current={v.inventory?.quantity ?? 0} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Card>

                        <AddVariantModal open={addVariantOpen} onClose={() => setAddVariantOpen(false)} productId={product!.id} attributes={attributes.data} />
                    </div>
                )}
        </AdminLayout>
    );
}

function UploadModal({ open, onClose, productId }: { open: boolean; onClose: () => void; productId: number }) {
    const fileRef    = useRef<HTMLInputElement>(null);
    const [altText, setAltText]       = useState('');
    const [processing, setProcessing] = useState(false);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const files = fileRef.current?.files;
        if (!files?.length) return;

        const formData = new FormData();
        Array.from(files).forEach((file) => formData.append('images[]', file));
        formData.append('alt_text', altText);

        setProcessing(true);
        router.post(route('admin.product-images.store', productId), formData, {
            onSuccess: () => { setProcessing(false); setAltText(''); onClose(); },
            onError:   () => setProcessing(false),
        });
    };

    return (
        <Modal open={open} onClose={onClose} title="Upload images"
            footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" form="upload-form" loading={processing}>Upload</Button></>}
        >
            <form id="upload-form" onSubmit={submit} className="space-y-3">
                <div>
                    <label className="text-sm font-medium text-ink-800">Images</label>
                    <input ref={fileRef} type="file" multiple accept=".jpg,.jpeg,.png,.webp,.avif" className="mt-1.5 block text-sm text-ink-600" />
                </div>
                <Input label="Alt text" value={altText} onChange={(e) => setAltText(e.target.value)} hint="Shared for all uploaded images" />
            </form>
        </Modal>
    );
}

function AddVariantModal({ open, onClose, productId, attributes }: { open: boolean; onClose: () => void; productId: number; attributes: Attribute[] }) {
    const { data, setData, post, processing, reset } = useForm({
        sku: '', price_override_cents: '', is_active: true, attribute_value_ids: [] as number[], initial_quantity: 0,
    });
    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.variants.store', productId), { onSuccess: () => { reset(); onClose(); } });
    };
    return (
        <Modal open={open} onClose={onClose} title="Add variant"
            footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" form="variant-form" loading={processing}>Add</Button></>}
        >
            <form id="variant-form" onSubmit={submit} className="space-y-4">
                <Input label="SKU" value={data.sku} onChange={(e) => setData('sku', e.target.value)} required />
                <Input label="Price override (₱)" type="number" value={data.price_override_cents} onChange={(e) => setData('price_override_cents', e.target.value)} hint="Leave blank to use product base price" />
                <Input label="Initial stock quantity" type="number" value={data.initial_quantity} onChange={(e) => setData('initial_quantity', parseInt(e.target.value) || 0)} />
                {attributes.map((attr) => (
                    <div key={attr.id}>
                        <label className="text-sm font-medium text-ink-800">{attr.display_name}</label>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {attr.values.map((val) => (
                                <button key={val.id} type="button"
                                    onClick={() => setData('attribute_value_ids', data.attribute_value_ids.includes(val.id)
                                        ? data.attribute_value_ids.filter(id => id !== val.id)
                                        : [...data.attribute_value_ids, val.id]
                                    )}
                                    className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${data.attribute_value_ids.includes(val.id) ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-ink-200 text-ink-600 hover:border-ink-300'}`}
                                >
                                    {val.display_value}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </form>
        </Modal>
    );
}

function InventoryInline({ variantId, current }: { variantId: number; current: number }) {
    const [editing, setEditing] = useState(false);
    const { data, setData, patch, processing } = useForm({ quantity: current, low_stock_threshold: '' });
    if (!editing) return (
        <button onClick={() => setEditing(true)} className="text-xs text-brand-600 hover:text-brand-700">Update stock</button>
    );
    return (
        <form onSubmit={(e) => { e.preventDefault(); patch(route('admin.inventory.update', variantId), { onSuccess: () => setEditing(false) }); }} className="flex items-center gap-1.5">
            <input type="number" value={data.quantity} onChange={(e) => setData('quantity', parseInt(e.target.value) || 0)} className="w-16 rounded border border-ink-300 px-1.5 py-0.5 text-xs" />
            <button type="submit" disabled={processing} className="text-xs text-brand-600">✓</button>
            <button type="button" onClick={() => setEditing(false)} className="text-xs text-ink-400">✕</button>
        </form>
    );
}
