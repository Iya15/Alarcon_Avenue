import Button from '@/Components/ui/Button';
import { useCartStore } from '@/stores/cartStore';
import CouponInput from './CouponInput';

interface Props {
    showCoupon?: boolean;
    showCheckout?: boolean;
    compact?: boolean;
}

function formatPrice(cents: number) {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(cents / 100);
}

function Row({ label, value, muted, bold, positive }: {
    label: string; value: string; muted?: boolean; bold?: boolean; positive?: boolean;
}) {
    return (
        <div className="flex items-baseline justify-between">
            <span className={muted ? 'text-sm text-ink-500' : 'text-sm text-ink-700'}>{label}</span>
            <span className={[
                'text-sm',
                bold ? 'font-bold text-ink-950' : 'text-ink-900',
                positive ? 'text-success-600' : '',
            ].filter(Boolean).join(' ')}>{value}</span>
        </div>
    );
}

export default function CartSummary({ showCoupon = true, showCheckout = true, compact = false }: Props) {
    const { totals, items } = useCartStore();

    const {
        subtotal_cents, discount_cents, shipping_cents, tax_cents, total_cents,
        free_shipping_remaining_cents, free_shipping_applied, free_shipping_threshold_cents,
    } = totals;

    const pct = Math.min(100, Math.round(
        ((free_shipping_threshold_cents - free_shipping_remaining_cents) / free_shipping_threshold_cents) * 100
    ));

    return (
        <div className="space-y-4">
            {/* Free shipping progress */}
            {!free_shipping_applied && free_shipping_remaining_cents > 0 && subtotal_cents > 0 && (
                <div className="rounded-xl border border-ink-200 bg-ink-50 p-3">
                    <p className="mb-2 text-xs text-ink-600">
                        Add <span className="font-semibold text-ink-900">{formatPrice(free_shipping_remaining_cents)}</span> more for free shipping
                    </p>
                    <div className="h-1.5 overflow-hidden rounded-full bg-ink-200">
                        <div
                            className="h-full rounded-full bg-brand-500 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                </div>
            )}
            {free_shipping_applied && (
                <div className="rounded-xl border border-success-200 bg-success-50 px-3 py-2 text-center text-xs font-medium text-success-700">
                    🎉 You've got free shipping!
                </div>
            )}

            {/* Coupon */}
            {showCoupon && <CouponInput />}

            {/* Totals */}
            <div className="space-y-2">
                <Row label="Subtotal" value={formatPrice(subtotal_cents)} />
                {discount_cents > 0 && (
                    <Row label="Discount" value={`-${formatPrice(discount_cents)}`} positive />
                )}
                <Row
                    label="Shipping"
                    value={shipping_cents === 0 && subtotal_cents > 0 ? 'Free' : shipping_cents > 0 ? formatPrice(shipping_cents) : '—'}
                    muted
                    positive={shipping_cents === 0 && subtotal_cents > 0}
                />
                <Row label={`VAT (12%, incl.)`} value={formatPrice(tax_cents)} muted />
                <div className="border-t border-ink-200 pt-2">
                    <Row label="Total" value={formatPrice(total_cents)} bold />
                </div>
                <p className="text-[11px] text-ink-400">
                    Price includes 12% VAT. VAT amount: {formatPrice(tax_cents)}
                </p>
            </div>

            {showCheckout && items.length > 0 && (
                <Button
                    href={route('cart.show')}
                    variant="primary"
                    size="lg"
                    fullWidth
                >
                    Proceed to Checkout
                </Button>
            )}
        </div>
    );
}
