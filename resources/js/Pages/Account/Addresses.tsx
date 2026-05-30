import Badge from '@/Components/ui/Badge';
import Button from '@/Components/ui/Button';
import Card from '@/Components/ui/Card';
import Input from '@/Components/ui/Input';
import Modal from '@/Components/ui/Modal';
import EmptyState from '@/Components/ui/EmptyState';
import AccountLayout from '@/Components/account/AccountLayout';
import { useToast } from '@/stores/toastStore';
import type { PageProps } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

interface Address {
    id: number; label: string | null; first_name: string; last_name: string;
    line_1: string; line_2: string | null; city: string; state: string;
    postal_code: string; country_code: string; phone: string | null;
    is_default_shipping: boolean; is_default_billing: boolean;
}
interface Props extends PageProps { addresses: Address[] }

const EMPTY_FORM = { label: '', first_name: '', last_name: '', phone: '', line_1: '', line_2: '',
    city: '', state: '', postal_code: '', country_code: 'PH', is_default_shipping: false, is_default_billing: false };

export default function AccountAddresses({ addresses }: Props) {
    const toast = useToast();
    const [editAddr, setEditAddr] = useState<Address | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    const { data, setData, post, put, processing, errors, reset } = useForm(EMPTY_FORM as Record<string, string | boolean>);

    const openNew = () => { reset(); setEditAddr(null); setModalOpen(true); };
    const openEdit = (a: Address) => {
        setData({ label: a.label ?? '', first_name: a.first_name, last_name: a.last_name,
            phone: a.phone ?? '', line_1: a.line_1, line_2: a.line_2 ?? '',
            city: a.city, state: a.state, postal_code: a.postal_code,
            country_code: a.country_code, is_default_shipping: a.is_default_shipping,
            is_default_billing: a.is_default_billing });
        setEditAddr(a); setModalOpen(true);
    };
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const opts = { onSuccess: () => { setModalOpen(false); toast.success(editAddr ? 'Address updated.' : 'Address added.'); } };
        editAddr ? put(route('account.addresses.update', editAddr.id), opts) : post(route('account.addresses.store'), opts);
    };

    return (
        <AccountLayout title="Saved Addresses">
            <Head title="Addresses" />
            <div className="mb-4 flex justify-end"><Button size="sm" onClick={openNew}>+ Add address</Button></div>

            {addresses.length === 0 ? (
                <EmptyState title="No saved addresses" description="Add a shipping address for faster checkout." />
            ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                    {addresses.map((a) => (
                        <Card key={a.id} bordered padding="sm">
                            <div className="flex items-start justify-between">
                                <div className="text-sm text-ink-700">
                                    {a.label && <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-400">{a.label}</p>}
                                    <p className="font-medium text-ink-900">{a.first_name} {a.last_name}</p>
                                    <p>{a.line_1}</p>
                                    <p>{a.city}, {a.state} {a.postal_code}</p>
                                    {a.phone && <p className="text-ink-400">{a.phone}</p>}
                                    <div className="mt-2 flex gap-1.5">
                                        {a.is_default_shipping && <Badge variant="brand" size="sm">Default shipping</Badge>}
                                        {a.is_default_billing && <Badge variant="subtle" size="sm">Default billing</Badge>}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1 shrink-0">
                                    <Button variant="ghost" size="sm" onClick={() => openEdit(a)}>Edit</Button>
                                    <Button variant="ghost" size="sm" onClick={() => router.delete(route('account.addresses.destroy', a.id))}>Delete</Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editAddr ? 'Edit address' : 'New address'}
                footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button type="submit" form="addr-form" loading={processing}>Save</Button></>}>
                <form id="addr-form" onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Input label="Label (optional)" value={String(data.label)} onChange={(e) => setData('label', e.target.value)} placeholder="Home, Work…" />
                    <div />
                    <Input label="First name" value={String(data.first_name)} onChange={(e) => setData('first_name', e.target.value)} error={errors.first_name} required />
                    <Input label="Last name" value={String(data.last_name)} onChange={(e) => setData('last_name', e.target.value)} error={errors.last_name} required />
                    <div className="sm:col-span-2"><Input label="Address line 1" value={String(data.line_1)} onChange={(e) => setData('line_1', e.target.value)} error={errors.line_1} required /></div>
                    <div className="sm:col-span-2"><Input label="Address line 2" value={String(data.line_2)} onChange={(e) => setData('line_2', e.target.value)} /></div>
                    <Input label="City" value={String(data.city)} onChange={(e) => setData('city', e.target.value)} error={errors.city} required />
                    <Input label="Province" value={String(data.state)} onChange={(e) => setData('state', e.target.value)} error={errors.state} required />
                    <Input label="ZIP" value={String(data.postal_code)} onChange={(e) => setData('postal_code', e.target.value)} error={errors.postal_code} required />
                    <Input label="Phone" value={String(data.phone)} onChange={(e) => setData('phone', e.target.value)} />
                    <div className="sm:col-span-2 flex gap-4 text-sm">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={Boolean(data.is_default_shipping)} onChange={(e) => setData('is_default_shipping', e.target.checked)} className="text-brand-500" />
                            Default shipping
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={Boolean(data.is_default_billing)} onChange={(e) => setData('is_default_billing', e.target.checked)} className="text-brand-500" />
                            Default billing
                        </label>
                    </div>
                </form>
            </Modal>
        </AccountLayout>
    );
}
