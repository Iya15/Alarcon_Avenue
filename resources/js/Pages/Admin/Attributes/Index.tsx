import Badge from '@/Components/ui/Badge';
import Button from '@/Components/ui/Button';
import Card from '@/Components/ui/Card';
import Modal from '@/Components/ui/Modal';
import Input from '@/Components/ui/Input';
import Select from '@/Components/ui/Select';
import AdminLayout from '@/Components/layout/AdminLayout';
import type { PageProps } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

interface AttributeValue { id: number; value: string; display_value: string; meta: Record<string, string> | null }
interface Attribute { id: number; name: string; display_name: string; type: string; values: AttributeValue[] }
interface Props extends PageProps { attributes: { data: Attribute[] } }

export default function AdminAttributesIndex({ attributes }: Props) {
    const [newAttrOpen, setNewAttrOpen] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '', display_name: '', type: 'select' as string, sort_order: 0,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.attributes.store'), { onSuccess: () => { reset(); setNewAttrOpen(false); } });
    };

    return (
        <AdminLayout title="Attributes">
            <Head title="Attributes — Admin" />
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-lg font-bold text-white">Attributes</h1>
                    <Button onClick={() => setNewAttrOpen(true)}>Add attribute</Button>
                </div>

                <div className="space-y-4">
                    {attributes.data.map((attr) => (
                        <Card key={attr.id} bordered>
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="font-semibold text-ink-900">{attr.display_name}</p>
                                    <p className="text-xs text-ink-500">name: {attr.name} · type: {attr.type}</p>
                                </div>
                                <button
                                    onClick={() => { if (confirm(`Delete "${attr.display_name}"?`)) router.delete(route('admin.attributes.destroy', attr.id)); }}
                                    className="text-xs text-danger-600 hover:text-danger-700"
                                >
                                    Delete
                                </button>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-1.5">
                                {attr.values.map((val) => (
                                    <div key={val.id} className="flex items-center gap-1 rounded-md border border-ink-200 bg-ink-50 px-2 py-0.5">
                                        {val.meta?.hex && (
                                            <span className="h-3 w-3 rounded-full border border-ink-300" style={{ backgroundColor: val.meta.hex }} />
                                        )}
                                        <span className="text-xs text-ink-700">{val.display_value}</span>
                                        <button
                                            onClick={() => router.delete(route('admin.attribute-values.destroy', val.id))}
                                            className="ml-1 text-ink-300 hover:text-danger-500"
                                        >×</button>
                                    </div>
                                ))}
                                <AddValueInline attributeId={attr.id} />
                            </div>
                        </Card>
                    ))}
                </div>

            <Modal open={newAttrOpen} onClose={() => setNewAttrOpen(false)} title="New attribute"
                footer={<><Button variant="secondary" onClick={() => setNewAttrOpen(false)}>Cancel</Button><Button type="submit" form="new-attr-form" loading={processing}>Create</Button></>}
            >
                <form id="new-attr-form" onSubmit={submit} className="space-y-4">
                    <Input label="Machine name" value={data.name} onChange={(e) => setData('name', e.target.value)} hint='e.g. "color" (lowercase, no spaces)' error={errors.name} />
                    <Input label="Display name" value={data.display_name} onChange={(e) => setData('display_name', e.target.value)} hint='e.g. "Color"' error={errors.display_name} />
                    <Select label="Type" value={data.type} onChange={(e) => setData('type', e.target.value)} options={[
                        { value: 'select', label: 'Dropdown' },
                        { value: 'color_swatch', label: 'Color swatch' },
                        { value: 'button', label: 'Button' },
                    ]} />
                </form>
            </Modal>
        </AdminLayout>
    );
}

function AddValueInline({ attributeId }: { attributeId: number }) {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, reset } = useForm({ value: '', display_value: '', meta: '' });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.attribute-values.store', attributeId), {
            onSuccess: () => { reset(); setOpen(false); },
        });
    };

    if (!open) {
        return (
            <button onClick={() => setOpen(true)} className="rounded-md border border-dashed border-ink-300 px-2 py-0.5 text-xs text-ink-400 hover:border-brand-500 hover:text-brand-500">
                + Add value
            </button>
        );
    }

    return (
        <form onSubmit={submit} className="flex items-center gap-1.5 rounded-md border border-brand-300 bg-brand-50 px-2 py-1">
            <input autoFocus placeholder="value" value={data.value} onChange={(e) => setData('value', e.target.value)} className="w-20 bg-transparent text-xs text-ink-900 focus:outline-none" />
            <input placeholder="label" value={data.display_value} onChange={(e) => setData('display_value', e.target.value)} className="w-20 bg-transparent text-xs text-ink-900 focus:outline-none" />
            <input placeholder="#hex" value={data.meta} onChange={(e) => setData('meta', e.target.value)} className="w-14 bg-transparent text-xs text-ink-900 focus:outline-none" />
            <button type="submit" disabled={processing} className="text-xs text-brand-600">✓</button>
            <button type="button" onClick={() => setOpen(false)} className="text-xs text-ink-400">✕</button>
        </form>
    );
}
