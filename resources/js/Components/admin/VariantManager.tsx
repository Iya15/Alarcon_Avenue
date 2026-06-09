import Input from '@/Components/ui/Input';
import { useState } from 'react';

export interface FormVariant {
    key: string;
    id?: number;
    name: string;
    sku: string;
    price_adjustment: number;
    stock_quantity: number;
}

interface Props {
    variants: FormVariant[];
    deletedVariantIds: number[];
    onVariantsChange: (variants: FormVariant[]) => void;
    onDeletedIdsChange: (ids: number[]) => void;
    errors?: Record<string, string>;
}

const emptyDraft = (): Omit<FormVariant, 'key'> => ({
    name: '',
    sku: '',
    price_adjustment: 0,
    stock_quantity: 0,
});

export default function VariantManager({ variants, deletedVariantIds, onVariantsChange, onDeletedIdsChange, errors }: Props) {
    const [adding, setAdding] = useState(false);
    const [draft, setDraft] = useState(emptyDraft());
    const [editingKey, setEditingKey] = useState<string | null>(null);

    const addVariant = () => {
        if (!draft.name.trim()) return;
        const newVariant: FormVariant = { ...draft, key: crypto.randomUUID() };
        onVariantsChange([...variants, newVariant]);
        setDraft(emptyDraft());
        setAdding(false);
    };

    const removeVariant = (key: string) => {
        const variant = variants.find((v) => v.key === key);
        onVariantsChange(variants.filter((v) => v.key !== key));
        if (variant?.id) {
            onDeletedIdsChange([...deletedVariantIds, variant.id]);
        }
    };

    const updateVariant = (key: string, field: keyof Omit<FormVariant, 'key' | 'id'>, value: string | number) => {
        onVariantsChange(variants.map((v) => v.key === key ? { ...v, [field]: value } : v));
    };

    return (
        <div>
            {/* Existing + pending variants */}
            {variants.length > 0 && (
                <div className="mb-4 divide-y divide-ink-100 rounded-lg border border-ink-200">
                    {variants.map((v, i) => (
                        <div key={v.key} className="flex items-center gap-3 px-4 py-3">
                            {editingKey === v.key ? (
                                // Inline edit row
                                <div className="flex flex-1 flex-wrap gap-2">
                                    <input
                                        className="w-36 rounded border border-ink-300 px-2 py-1 text-xs"
                                        placeholder="Name"
                                        value={v.name}
                                        onChange={(e) => updateVariant(v.key, 'name', e.target.value)}
                                    />
                                    <input
                                        className="w-28 rounded border border-ink-300 px-2 py-1 text-xs font-mono"
                                        placeholder="SKU"
                                        value={v.sku}
                                        onChange={(e) => updateVariant(v.key, 'sku', e.target.value)}
                                    />
                                    <input
                                        type="number"
                                        className="w-24 rounded border border-ink-300 px-2 py-1 text-xs"
                                        placeholder="Price adj ₱"
                                        value={v.price_adjustment / 100}
                                        onChange={(e) => updateVariant(v.key, 'price_adjustment', Math.round(parseFloat(e.target.value || '0') * 100))}
                                    />
                                    <input
                                        type="number"
                                        className="w-20 rounded border border-ink-300 px-2 py-1 text-xs"
                                        placeholder="Stock"
                                        value={v.stock_quantity}
                                        onChange={(e) => updateVariant(v.key, 'stock_quantity', parseInt(e.target.value) || 0)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setEditingKey(null)}
                                        className="text-xs font-medium text-brand-600 hover:text-brand-700"
                                    >
                                        Done
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <span className="w-5 text-xs text-ink-400">{i + 1}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="truncate text-sm font-medium text-ink-900">{v.name || <span className="text-ink-400 italic">Unnamed</span>}</p>
                                        <p className="text-xs text-ink-400">
                                            {v.sku && <span className="font-mono mr-2">{v.sku}</span>}
                                            {v.price_adjustment !== 0 && <span className="mr-2">{v.price_adjustment > 0 ? '+' : ''}₱{(v.price_adjustment / 100).toLocaleString('en-PH')}</span>}
                                            <span>{v.stock_quantity} in stock</span>
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setEditingKey(v.key)}
                                        className="text-xs text-ink-500 hover:text-ink-900"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => removeVariant(v.key)}
                                        className="text-xs text-danger-600 hover:text-danger-700"
                                        aria-label="Remove variant"
                                    >
                                        ✕
                                    </button>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Error display */}
            {errors && Object.keys(errors).some((k) => k.startsWith('variants')) && (
                <p className="mb-2 text-xs text-danger-600">
                    {Object.entries(errors).find(([k]) => k.startsWith('variants'))?.[1]}
                </p>
            )}

            {/* Inline add form */}
            {adding ? (
                <div className="rounded-lg border border-brand-300 bg-brand-50/40 p-4">
                    <p className="mb-3 text-xs font-semibold text-ink-700 uppercase tracking-wide">New variant</p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div className="col-span-2 sm:col-span-1">
                            <label className="text-xs font-medium text-ink-700">Name <span className="text-danger-500">*</span></label>
                            <input
                                className="mt-1 w-full rounded border border-ink-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
                                placeholder="e.g. Small Red"
                                value={draft.name}
                                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-ink-700">SKU</label>
                            <input
                                className="mt-1 w-full rounded border border-ink-300 px-2 py-1.5 text-sm font-mono focus:border-brand-500 focus:outline-none"
                                placeholder="Auto-generated"
                                value={draft.sku}
                                onChange={(e) => setDraft({ ...draft, sku: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-ink-700">Price adj (₱)</label>
                            <input
                                type="number"
                                className="mt-1 w-full rounded border border-ink-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
                                placeholder="0"
                                value={draft.price_adjustment / 100}
                                onChange={(e) => setDraft({ ...draft, price_adjustment: Math.round(parseFloat(e.target.value || '0') * 100) })}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-ink-700">Stock qty</label>
                            <input
                                type="number"
                                min={0}
                                className="mt-1 w-full rounded border border-ink-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
                                placeholder="0"
                                value={draft.stock_quantity}
                                onChange={(e) => setDraft({ ...draft, stock_quantity: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                        <button
                            type="button"
                            onClick={addVariant}
                            disabled={!draft.name.trim()}
                            className="rounded-lg bg-brand px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-40 hover:bg-brand/90"
                        >
                            Add
                        </button>
                        <button
                            type="button"
                            onClick={() => { setAdding(false); setDraft(emptyDraft()); }}
                            className="rounded-lg border border-ink-200 px-4 py-1.5 text-sm text-ink-600 hover:bg-ink-50"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => setAdding(true)}
                    className="flex items-center gap-1.5 rounded-lg border border-dashed border-ink-300 px-4 py-2 text-sm font-medium text-ink-600 transition-colors hover:border-brand hover:text-brand"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Add variant
                </button>
            )}
        </div>
    );
}
