import AdminLayout from '@/Components/layout/AdminLayout';
import { Head, useForm } from '@inertiajs/react';
import type { PageProps } from '@/types';

interface Coupon {
    id: number; code: string; discount_type: string; discount_value: number;
    min_order_cents: number | null; max_uses: number | null; max_uses_per_user: number | null;
    is_active: boolean; starts_at: string | null; expires_at: string | null;
}

interface Props extends PageProps { coupon: Coupon | null }

export default function AdminCouponCreateEdit({ coupon }: Props) {
    const isEdit = !!coupon;
    const { data, setData, post, put, processing, errors } = useForm({
        code:              coupon?.code ?? '',
        discount_type:     coupon?.discount_type ?? 'percent',
        discount_value:    coupon?.discount_value ?? 0,
        min_order_cents:   coupon?.min_order_cents ?? '',
        max_uses:          coupon?.max_uses ?? '',
        max_uses_per_user: coupon?.max_uses_per_user ?? '',
        is_active:         coupon?.is_active ?? true,
        starts_at:         coupon?.starts_at ? coupon.starts_at.slice(0, 10) : '',
        expires_at:        coupon?.expires_at ? coupon.expires_at.slice(0, 10) : '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (isEdit) {
            put(route('admin.coupons.update', coupon.id));
        } else {
            post(route('admin.coupons.store'));
        }
    }

    const field = (label: string, key: keyof typeof data, props = {}) => (
        <div>
            <label className="mb-1 block text-xs font-medium text-ink-600">{label}</label>
            <input
                value={data[key] as string | number}
                onChange={(e) => setData(key, e.target.value as never)}
                className="w-full rounded-lg bg-surface border border-ink-200 px-3 py-2 text-sm text-ink-900 focus:border-[#e7901d] focus:outline-none"
                {...props}
            />
            {errors[key] && <p className="mt-1 text-xs text-red-500">{errors[key]}</p>}
        </div>
    );

    return (
        <AdminLayout title={isEdit ? `Edit ${coupon.code}` : 'New Coupon'}>
            <Head title={`${isEdit ? 'Edit' : 'New'} Coupon — Admin`} />
            <div className="max-w-lg">
                <form onSubmit={submit} className="space-y-4 rounded-xl border border-ink-200 bg-surface p-6">
                    {field('Code', 'code', { placeholder: 'SUMMER25' })}

                    <div>
                        <label className="mb-1 block text-xs font-medium text-ink-600">Discount type</label>
                        <select
                            value={data.discount_type}
                            onChange={(e) => setData('discount_type', e.target.value)}
                            className="w-full rounded-lg bg-surface border border-ink-200 px-3 py-2 text-sm text-ink-900 focus:outline-none focus:border-[#e7901d]"
                        >
                            <option value="percent">Percent</option>
                            <option value="fixed">Fixed amount (cents)</option>
                            <option value="free_shipping">Free shipping</option>
                        </select>
                    </div>

                    {data.discount_type !== 'free_shipping' && field('Discount value', 'discount_value', { type: 'number', min: 0 })}
                    {field('Min order (cents, optional)', 'min_order_cents', { type: 'number', min: 0, placeholder: '' })}
                    {field('Max total uses (optional)', 'max_uses', { type: 'number', min: 1, placeholder: '' })}
                    {field('Max uses per user (optional)', 'max_uses_per_user', { type: 'number', min: 1, placeholder: '' })}
                    {field('Starts at (optional)', 'starts_at', { type: 'date' })}
                    {field('Expires at (optional)', 'expires_at', { type: 'date' })}

                    <label className="flex items-center gap-2 text-sm text-ink-700">
                        <input type="checkbox" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)} className="accent-[#e7901d]" />
                        Active
                    </label>

                    <button type="submit" disabled={processing}
                        className="w-full rounded-lg bg-[#e7901d] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 hover:bg-[#c97a18]">
                        {isEdit ? 'Update coupon' : 'Create coupon'}
                    </button>
                </form>
            </div>
        </AdminLayout>
    );
}
