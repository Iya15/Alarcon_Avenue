import Button from '@/Components/ui/Button';
import { useCartStore } from '@/stores/cartStore';
import { useState } from 'react';

export default function CouponInput() {
    const { totals, coupon_code, applyCoupon, removeCoupon, error } = useCartStore();
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    const activeCoupon = totals.coupon;

    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim()) return;
        setLoading(true);
        setLocalError(null);
        try {
            await applyCoupon(code.trim());
            setCode('');
        } catch (err: unknown) {
            setLocalError(err instanceof Error ? err.message : 'Invalid coupon code.');
        } finally {
            setLoading(false);
        }
    };

    if (activeCoupon) {
        return (
            <div className="flex items-center justify-between rounded-lg border border-success-200 bg-success-50 px-3 py-2.5">
                <div>
                    <p className="text-xs font-semibold text-success-700">Coupon applied: {activeCoupon.code}</p>
                    <p className="text-xs text-success-600">
                        {activeCoupon.type === 'free_shipping'
                            ? 'Free shipping'
                            : activeCoupon.type === 'percentage'
                            ? `${activeCoupon.value}% off`
                            : `₱${(activeCoupon.value / 100).toLocaleString('en-PH')} off`}
                    </p>
                </div>
                <button
                    onClick={() => removeCoupon()}
                    className="rounded-lg p-1 text-success-500 hover:bg-success-100 hover:text-success-700 transition-colors"
                    aria-label="Remove coupon"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleApply} className="space-y-2">
            <div className="flex gap-2">
                <input
                    type="text"
                    value={code}
                    onChange={(e) => { setCode(e.target.value.toUpperCase()); setLocalError(null); }}
                    placeholder="Coupon code"
                    className="flex-1 rounded-lg border border-ink-200 bg-surface px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 uppercase"
                />
                <Button type="submit" variant="secondary" size="sm" loading={loading} disabled={!code.trim()}>
                    Apply
                </Button>
            </div>
            {(localError) && (
                <p className="text-xs text-danger-600">{localError}</p>
            )}
        </form>
    );
}
