import Button from '@/Components/ui/Button';
import Card from '@/Components/ui/Card';
import Checkbox from '@/Components/ui/Checkbox';
import Input from '@/Components/ui/Input';
import Modal from '@/Components/ui/Modal';
import Select from '@/Components/ui/Select';
import VariantManager, { type FormVariant } from '@/Components/admin/VariantManager';
import AdminLayout from '@/Components/layout/AdminLayout';
import { useToast } from '@/stores/toastStore';
import type { PageProps } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';

interface Category { id: number; name: string }
interface AttrValue { id: number; value: string; display_value: string; attribute_id: number }
interface Attribute { id: number; display_name: string; values: AttrValue[] }
interface ProductImage { id: number; url: string; is_primary: boolean; sort_order: number }
interface Variant {
    id: number; name: string | null; sku: string; is_active: boolean;
    effective_price: number; price_override_cents: number | null;
    attribute_values: AttrValue[];
    inventory: { available: number; quantity: number } | null;
}
interface ProductAttr { key: string; value: string }
interface Product {
    id: number; name: string; slug: string; description: string | null; short_description: string | null;
    base_price_cents: number; compare_at_price_cents: number | null; cost_price_cents: number | null;
    status: string; is_featured: boolean; meta_title: string | null; meta_description: string | null;
    categories: Category[]; images: ProductImage[]; variants: Variant[];
    attributes: ProductAttr[];
}

interface Props extends PageProps {
    product?: Product;
    categories: { data: Category[] };
    attributes: { data: Attribute[] };
}

function toFormVariants(variants: Variant[]): FormVariant[] {
    return variants.map((v) => ({
        key: String(v.id),
        id: v.id,
        name: v.name ?? v.sku,
        sku: v.sku,
        price_adjustment: v.price_override_cents ?? 0,
        stock_quantity: v.inventory?.quantity ?? 0,
    }));
}

export default function AdminProductForm({ product, categories }: Props) {
    const isEditing = !!product;
    const [uploadOpen, setUploadOpen] = useState(false);
    const imagesRef = useRef<HTMLDivElement>(null);
    const toast = useToast();

    const { data, setData, post, put, processing, errors, reset } = useForm<{
        name: string; slug: string; description: string; short_description: string;
        base_price_cents: number; compare_at_price_cents: number | string;
        cost_price_cents: number | string; status: string; is_featured: boolean;
        meta_title: string; meta_description: string; category_ids: number[];
        images: File[];
        variants: FormVariant[];
        deleted_variant_ids: number[];
        attributes: ProductAttr[];
    }>({
        name:                   product?.name ?? '',
        slug:                   product?.slug ?? '',
        description:            product?.description ?? '',
        short_description:      product?.short_description ?? '',
        base_price_cents:       product?.base_price_cents ?? 0,
        compare_at_price_cents: product?.compare_at_price_cents ?? '',
        cost_price_cents:       product?.cost_price_cents ?? '',
        status:                 product?.status ?? 'active',
        is_featured:            product?.is_featured ?? false,
        meta_title:             product?.meta_title ?? '',
        meta_description:       product?.meta_description ?? '',
        category_ids:           product?.categories?.map((c) => c.id) ?? [],
        images:                 [],
        variants:               product?.variants ? toFormVariants(product.variants) : [],
        deleted_variant_ids:    [],
        attributes:             product?.attributes?.map((a) => ({ key: a.key, value: a.value })) ?? [],
    });

    const [previews, setPreviews] = useState<string[]>([]);
    const [formErrors, setFormErrors] = useState<string[]>([]);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        setData('images', files);
        setPreviews(files.map((f) => URL.createObjectURL(f)));
    };

    const addAttribute = () => setData('attributes', [...data.attributes, { key: '', value: '' }]);

    const updateAttribute = (i: number, field: 'key' | 'value', val: string) => {
        const updated = data.attributes.map((a, idx) => idx === i ? { ...a, [field]: val } : a);
        setData('attributes', updated);
    };

    const removeAttribute = (i: number) => setData('attributes', data.attributes.filter((_, idx) => idx !== i));

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const errs: string[] = [];
        if (!data.name.trim()) errs.push('Product name is required.');
        if (data.base_price_cents <= 0) errs.push('Base price must be greater than ₱0.');
        if (data.category_ids.length === 0) errs.push('At least one category is required.');
        if (errs.length) { setFormErrors(errs); return; }
        setFormErrors([]);

        if (isEditing) {
            put(route('admin.products.update', product!.id), {
                onSuccess: () => toast.success('Product updated successfully'),
            });
        } else {
            post(route('admin.products.store'), {
                forceFormData: true,
                onSuccess: () => {
                    toast.success('Product created successfully');
                    reset();
                    setPreviews([]);
                },
            });
        }
    };

    const destroyImage = (imageId: number) => {
        if (confirm('Delete this image?')) router.delete(route('admin.product-images.destroy', imageId));
    };
    const setPrimary = (imageId: number) => router.patch(route('admin.product-images.primary', imageId));

    return (
        <AdminLayout title={isEditing ? `Edit ${product!.name}` : 'New Product'}>
            <Head title={isEditing ? `Edit ${product!.name}` : 'New Product — Admin'} />

            <div className="mb-6 flex items-center gap-4">
                <Link href={route('admin.products.index')} className="text-sm text-ink-500 hover:text-ink-900">← Products</Link>
                <h1 className="text-2xl font-bold tracking-tight text-ink-950">
                    {isEditing ? product!.name : 'New Product'}
                </h1>
            </div>

            <form onSubmit={submit} className="space-y-5 pb-24">

                {/* ── 1. Basic info ─────────────────────────────────────────── */}
                <Card bordered>
                    <h2 className="mb-4 font-semibold text-ink-900">Basic info</h2>
                    <div className="space-y-4">
                        <Input label="Product name" value={data.name} onChange={(e) => setData('name', e.target.value)} error={errors.name} required />
                        <Input label="Slug" value={data.slug} onChange={(e) => setData('slug', e.target.value)} hint="Auto-generated if blank." error={errors.slug} />
                        <div>
                            <label className="text-sm font-medium text-ink-800">Description</label>
                            <textarea
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                rows={5}
                                className="mt-1.5 w-full rounded-lg border border-ink-200 bg-surface px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                        </div>
                        <Input label="Short description" value={data.short_description} onChange={(e) => setData('short_description', e.target.value)} hint="Shown on listing cards." error={errors.short_description} />
                    </div>
                </Card>

                {/* ── 2. Pricing ────────────────────────────────────────────── */}
                <Card bordered>
                    <h2 className="mb-4 font-semibold text-ink-900">Pricing</h2>
                    <div className="grid grid-cols-3 gap-4">
                        <Input label="Base price (₱)" type="number" value={data.base_price_cents / 100} onChange={(e) => setData('base_price_cents', Math.round(parseFloat(e.target.value) * 100) || 0)} error={errors.base_price_cents} />
                        <Input label="Compare at (₱)" type="number" value={data.compare_at_price_cents ? +data.compare_at_price_cents / 100 : ''} onChange={(e) => setData('compare_at_price_cents', e.target.value ? Math.round(parseFloat(e.target.value) * 100) : '')} hint="Strike-through price" />
                        <Input label="Cost (₱)" type="number" value={data.cost_price_cents ? +data.cost_price_cents / 100 : ''} onChange={(e) => setData('cost_price_cents', e.target.value ? Math.round(parseFloat(e.target.value) * 100) : '')} hint="Internal only" />
                    </div>
                </Card>

                {/* ── 3. Status, Categories, Featured ──────────────────────── */}
                <Card bordered>
                    <h2 className="mb-4 font-semibold text-ink-900">Status & categories</h2>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div className="space-y-3">
                            <Select
                                label="Status"
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value)}
                                options={[
                                    { value: 'active',   label: 'Active' },
                                    { value: 'draft',    label: 'Draft' },
                                    { value: 'archived', label: 'Archived' },
                                ]}
                            />
                            <Checkbox
                                label="Featured"
                                description="Show in featured sections"
                                checked={data.is_featured}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData('is_featured', e.target.checked)}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-ink-800">
                                Categories <span className="text-danger-500">*</span>
                            </label>
                            {errors.category_ids && (
                                <p className="mt-0.5 text-xs text-danger-600">{errors.category_ids}</p>
                            )}
                            <div className="mt-1.5 max-h-40 space-y-1.5 overflow-y-auto rounded-lg border border-ink-200 p-2">
                                {categories.data.map((cat) => (
                                    <Checkbox
                                        key={cat.id}
                                        label={cat.name}
                                        checked={data.category_ids.includes(cat.id)}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            setData('category_ids', e.target.checked
                                                ? [...data.category_ids, cat.id]
                                                : data.category_ids.filter((id) => id !== cat.id)
                                            );
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* ── 4. Images ─────────────────────────────────────────────── */}
                {!isEditing && (
                    <Card bordered>
                        <h2 className="mb-3 font-semibold text-ink-900">Product images</h2>
                        <p className="mb-4 text-sm text-ink-500">Select images to upload with this product. Accepted: JPG, PNG, WebP, AVIF — max 8 MB each.</p>
                        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink-200 bg-ink-50 py-8 text-center transition hover:border-brand hover:bg-brand/5">
                            <svg className="h-8 w-8 text-ink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                            </svg>
                            <span className="text-sm font-medium text-ink-600">Click to select images</span>
                            <span className="text-xs text-ink-400">or drag and drop</span>
                            <input type="file" multiple accept=".jpg,.jpeg,.png,.webp,.avif" className="sr-only" onChange={handleImageSelect} />
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
                                        {i === 0 && <span className="absolute left-1 top-1 rounded-full bg-brand px-1.5 py-0.5 text-[9px] font-semibold text-white">Primary</span>}
                                    </div>
                                ))}
                            </div>
                        )}
                        {data.images.length > 0 && (
                            <p className="mt-3 text-xs text-ink-500">{data.images.length} image{data.images.length !== 1 ? 's' : ''} selected. First image will be set as primary.</p>
                        )}
                    </Card>
                )}

                {isEditing && (
                    <div ref={imagesRef}>
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
                        <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} productId={product!.id} />
                    </Card>
                    </div>
                )}

                {/* ── 5. Variants ───────────────────────────────────────────── */}
                <Card bordered>
                    <h2 className="mb-1 font-semibold text-ink-900">Variants</h2>
                    <p className="mb-4 text-sm text-ink-500">Add size, colour, or other options. Each variant has its own stock and optional price adjustment.</p>
                    <VariantManager
                        variants={data.variants}
                        deletedVariantIds={data.deleted_variant_ids}
                        onVariantsChange={(v) => setData('variants', v)}
                        onDeletedIdsChange={(ids) => setData('deleted_variant_ids', ids)}
                        errors={errors as Record<string, string>}
                    />
                </Card>

                {/* ── 6. Product attributes ─────────────────────────────────── */}
                <Card bordered>
                    <h2 className="mb-1 font-semibold text-ink-900">Product attributes</h2>
                    <p className="mb-4 text-sm text-ink-500">Key-value details like Material, Weight, or Dimensions.</p>

                    {data.attributes.length > 0 && (
                        <div className="mb-3 divide-y divide-ink-100 rounded-lg border border-ink-200">
                            {data.attributes.map((attr, i) => (
                                <div key={i} className="flex items-center gap-2 px-3 py-2">
                                    <input
                                        className="w-36 rounded border border-ink-200 bg-surface px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
                                        placeholder="e.g. Material"
                                        value={attr.key}
                                        onChange={(e) => updateAttribute(i, 'key', e.target.value)}
                                    />
                                    <span className="text-ink-400">:</span>
                                    <input
                                        className="flex-1 rounded border border-ink-200 bg-surface px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
                                        placeholder="e.g. Cotton"
                                        value={attr.value}
                                        onChange={(e) => updateAttribute(i, 'value', e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeAttribute(i)}
                                        className="shrink-0 rounded p-1 text-ink-400 hover:text-danger-600"
                                        aria-label="Remove attribute"
                                    >
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={addAttribute}
                        className="flex items-center gap-1.5 rounded-lg border border-dashed border-ink-300 px-4 py-2 text-sm font-medium text-ink-600 transition-colors hover:border-brand hover:text-brand"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Add attribute
                    </button>
                </Card>

                {/* ── 7. SEO ────────────────────────────────────────────────── */}
                <Card bordered>
                    <h2 className="mb-4 font-semibold text-ink-900">SEO</h2>
                    <div className="space-y-3">
                        <Input label="Meta title" value={data.meta_title} onChange={(e) => setData('meta_title', e.target.value)} hint="Default: product name" />
                        <Input label="Meta description" value={data.meta_description} onChange={(e) => setData('meta_description', e.target.value)} />
                    </div>
                </Card>

                {/* ── Validation errors ─────────────────────────────────────── */}
                {formErrors.length > 0 && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                        <p className="mb-1 text-sm font-medium text-red-700">Please fix the following:</p>
                        <ul className="list-inside list-disc space-y-0.5 text-sm text-red-600">
                            {formErrors.map((e) => <li key={e}>{e}</li>)}
                        </ul>
                    </div>
                )}

                {/* ── 8. Save button — full-width, sticky to page bottom ────── */}
                <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-ink-200 bg-surface/95 px-4 py-3 backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
                    <button
                        type="submit"
                        disabled={processing}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#e7901d] px-6 py-3.5 text-base font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-60 sm:rounded-xl"
                    >
                        {processing && (
                            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                            </svg>
                        )}
                        {processing ? 'Saving…' : (isEditing ? 'Update Product' : 'Create Product')}
                    </button>
                </div>
            </form>
        </AdminLayout>
    );
}

function UploadModal({ open, onClose, productId }: { open: boolean; onClose: () => void; productId: number }) {
    const [altText, setAltText] = useState('');
    const [processing, setProcessing] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (!files.length) return;
        setSelectedFiles((prev) => [...prev, ...files]);
        setPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
        e.target.value = '';
    };

    const removeFile = (i: number) => {
        URL.revokeObjectURL(previews[i]);
        setSelectedFiles((prev) => prev.filter((_, j) => j !== i));
        setPreviews((prev) => prev.filter((_, j) => j !== i));
    };

    const resetModal = () => {
        previews.forEach((url) => URL.revokeObjectURL(url));
        setSelectedFiles([]);
        setPreviews([]);
        setAltText('');
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFiles.length) return;
        const formData = new FormData();
        selectedFiles.forEach((file) => formData.append('images[]', file));
        formData.append('alt_text', altText);
        setProcessing(true);
        router.post(route('admin.product-images.store', productId), formData, {
            onSuccess: () => { resetModal(); onClose(); },
            onError:   () => {},
            onFinish:  () => setProcessing(false),
        });
    };

    return (
        <Modal
            open={open}
            onClose={() => { resetModal(); onClose(); }}
            title="Upload images"
            footer={
                <>
                    <Button variant="secondary" onClick={() => { resetModal(); onClose(); }}>Cancel</Button>
                    <Button type="submit" form="upload-form" loading={processing} disabled={!selectedFiles.length}>
                        Upload{selectedFiles.length > 0 ? ` (${selectedFiles.length})` : ''}
                    </Button>
                </>
            }
        >
            <form id="upload-form" onSubmit={submit} className="space-y-4">
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink-200 bg-ink-50 py-6 text-center transition hover:border-brand hover:bg-brand/5">
                    <svg className="h-7 w-7 text-ink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    <span className="text-sm font-medium text-ink-600">Click to select images</span>
                    <span className="text-xs text-ink-400">JPG, PNG, WebP, AVIF — max 8 MB each</span>
                    <input type="file" multiple accept=".jpg,.jpeg,.png,.webp,.avif" className="sr-only" onChange={handleFileChange} />
                </label>
                {previews.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                        {previews.map((src, i) => (
                            <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-ink-200">
                                <img src={src} alt="" className="h-full w-full object-cover" />
                                <button type="button" onClick={() => removeFile(i)} className="absolute inset-0 hidden items-center justify-center bg-black/50 group-hover:flex">
                                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                <Input label="Alt text (optional)" value={altText} onChange={(e) => setAltText(e.target.value)} hint="Applies to all uploaded images" />
            </form>
        </Modal>
    );
}
