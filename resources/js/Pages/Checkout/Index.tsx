import Badge from '@/Components/ui/Badge';
import Button from '@/Components/ui/Button';
import Card from '@/Components/ui/Card';
import Input from '@/Components/ui/Input';
import Spinner from '@/Components/ui/Spinner';
import Container from '@/Components/layout/Container';
import PageLayout from '@/Components/layout/PageLayout';
import type { CartData } from '@/stores/cartStore';
import type { PageProps } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface SavedAddress {
    id: number; label: string | null;
    first_name: string; last_name: string; phone: string | null;
    line_1: string; line_2: string | null;
    city: string; state: string; postal_code: string; country_code: string;
    is_default_shipping: boolean;
}

interface PaymentMethod { value: string; label: string; description: string }

interface Props extends PageProps {
    cart: CartData;
    saved_addresses: SavedAddress[];
    default_address: SavedAddress | null;
    payment_methods: PaymentMethod[];
}

type Step = 'shipping' | 'delivery' | 'payment' | 'review';

function formatPrice(cents: number) {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(cents / 100);
}

const STEPS: { id: Step; label: string }[] = [
    { id: 'shipping', label: 'Shipping' },
    { id: 'delivery', label: 'Delivery' },
    { id: 'payment', label: 'Payment' },
    { id: 'review',  label: 'Review' },
];

function StepIndicator({ current }: { current: Step }) {
    const idx = STEPS.findIndex((s) => s.id === current);
    return (
        <div className="flex items-center gap-0">
            {STEPS.map((step, i) => (
                <div key={step.id} className="flex items-center">
                    <div className="flex flex-col items-center">
                        <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                            i < idx  ? 'bg-brand-500 text-white'
                            : i === idx ? 'bg-ink-950 text-white'
                            : 'bg-ink-200 text-ink-400'
                        }`}>
                            {i < idx ? (
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                            ) : i + 1}
                        </div>
                        <span className={`mt-1 hidden text-[11px] sm:block ${i === idx ? 'font-semibold text-ink-900' : 'text-ink-400'}`}>
                            {step.label}
                        </span>
                    </div>
                    {i < STEPS.length - 1 && (
                        <div className={`mx-2 h-px w-8 sm:w-16 ${i < idx ? 'bg-brand-500' : 'bg-ink-200'}`} />
                    )}
                </div>
            ))}
        </div>
    );
}

// ── Address form ──────────────────────────────────────────────────────────────

interface AddressFormProps {
    prefix?: string;
    values: Record<string, string>;
    errors: Record<string, string>;
    onChange: (field: string, value: string) => void;
}

function AddressForm({ prefix = '', values, errors, onChange }: AddressFormProps) {
    const f = (k: string) => `${prefix}${k}`;
    const PH_STATES = [
        'Metro Manila', 'Cebu', 'Davao', 'Laguna', 'Cavite', 'Rizal', 'Bulacan',
        'Pampanga', 'Batangas', 'Quezon', 'Iloilo', 'Negros Occidental', 'Bohol',
        'Leyte', 'Nueva Ecija', 'Zambales',
    ];
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="First name" value={values[f('first_name')] ?? ''} onChange={(e) => onChange(f('first_name'), e.target.value)} error={errors[f('first_name')]} required />
            <Input label="Last name"  value={values[f('last_name')]  ?? ''} onChange={(e) => onChange(f('last_name'),  e.target.value)} error={errors[f('last_name')]}  required />
            <div className="sm:col-span-2">
                <Input label="Address line 1" value={values[f('line_1')] ?? ''} onChange={(e) => onChange(f('line_1'), e.target.value)} error={errors[f('line_1')]} required />
            </div>
            <div className="sm:col-span-2">
                <Input label="Address line 2 (optional)" value={values[f('line_2')] ?? ''} onChange={(e) => onChange(f('line_2'), e.target.value)} error={errors[f('line_2')]} />
            </div>
            <Input label="City" value={values[f('city')] ?? ''} onChange={(e) => onChange(f('city'), e.target.value)} error={errors[f('city')]} required />
            <div>
                <label className="text-sm font-medium text-ink-800">Province / Region</label>
                <select value={values[f('state')] ?? ''} onChange={(e) => onChange(f('state'), e.target.value)}
                    className="mt-1.5 h-10 w-full rounded-lg border border-ink-200 bg-surface px-3 text-sm text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500">
                    <option value="">Select province…</option>
                    {PH_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors[f('state')] && <p className="mt-1 text-xs text-danger-600">{errors[f('state')]}</p>}
            </div>
            <Input label="ZIP / Postal code" value={values[f('postal_code')] ?? ''} onChange={(e) => onChange(f('postal_code'), e.target.value)} error={errors[f('postal_code')]} required />
            <Input label="Phone number" value={values[f('phone')] ?? ''} onChange={(e) => onChange(f('phone'), e.target.value)} error={errors[f('phone')]} required />
        </div>
    );
}

// ── Order summary sidebar ─────────────────────────────────────────────────────

function OrderSummary({ cart }: { cart: CartData }) {
    const { totals, items } = cart;
    const activeItems = items.filter((i) => !i.saved_for_later);
    return (
        <div className="space-y-4">
            <div className="max-h-64 space-y-3 overflow-y-auto">
                {activeItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                            {item.image_url && <img src={item.image_url} alt={item.product_name ?? ''} className="h-full w-full object-cover" />}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium text-ink-900">{item.product_name}</p>
                            {item.variant_label && <p className="text-[11px] text-ink-400">{item.variant_label}</p>}
                            <p className="text-xs text-ink-500">Qty {item.quantity}</p>
                        </div>
                        <span className="shrink-0 text-sm font-semibold text-ink-950">{formatPrice(item.line_total_cents)}</span>
                    </div>
                ))}
            </div>

            <div className="border-t border-ink-100 pt-3 space-y-1.5">
                <div className="flex justify-between text-sm text-ink-600"><span>Subtotal</span><span>{formatPrice(totals.subtotal_cents)}</span></div>
                {totals.discount_cents > 0 && (
                    <div className="flex justify-between text-sm text-success-600"><span>Discount</span><span>-{formatPrice(totals.discount_cents)}</span></div>
                )}
                <div className="flex justify-between text-sm text-ink-600">
                    <span>Shipping</span>
                    <span>{totals.shipping_cents === 0 ? 'Free' : formatPrice(totals.shipping_cents)}</span>
                </div>
                <div className="flex justify-between text-xs text-ink-400"><span>VAT (12%, incl.)</span><span>{formatPrice(totals.tax_cents)}</span></div>
                <div className="flex justify-between border-t border-ink-200 pt-2 text-base font-bold text-ink-950">
                    <span>Total</span><span>{formatPrice(totals.total_cents)}</span>
                </div>
            </div>
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CheckoutIndex({ cart, saved_addresses, default_address, payment_methods }: Props) {
    const { auth } = usePage<PageProps>().props;
    const isGuest = !auth.user;

    const [step, setStep] = useState<Step>('shipping');
    const [billingIsSame, setBillingIsSame] = useState(true);
    const [selectedSavedAddress, setSelectedSavedAddress] = useState<number | 'new'>(
        default_address ? default_address.id : (saved_addresses.length === 0 ? 'new' : saved_addresses[0]?.id)
    );

    const { data, setData, post, processing, errors } = useForm<Record<string, string | boolean>>({
        // Guest contact
        email: '',

        // Shipping
        first_name: default_address?.first_name ?? '',
        last_name:  default_address?.last_name  ?? '',
        phone:      default_address?.phone       ?? '',
        line_1:     default_address?.line_1      ?? '',
        line_2:     default_address?.line_2      ?? '',
        city:       default_address?.city        ?? '',
        state:      default_address?.state       ?? '',
        postal_code: default_address?.postal_code ?? '',
        country_code: default_address?.country_code ?? 'PH',

        // Billing
        billing_same_as_shipping: true,

        // Payment
        payment_method: 'cod',

        // Notes
        notes: '',
    });

    const fillFromSaved = (addr: SavedAddress) => {
        setData((prev) => ({
            ...prev,
            first_name:   addr.first_name,
            last_name:    addr.last_name,
            phone:        addr.phone ?? '',
            line_1:       addr.line_1,
            line_2:       addr.line_2 ?? '',
            city:         addr.city,
            state:        addr.state,
            postal_code:  addr.postal_code,
            country_code: addr.country_code,
        }));
    };

    const handleSavedAddressSelect = (id: number | 'new') => {
        setSelectedSavedAddress(id);
        if (id !== 'new') {
            const addr = saved_addresses.find((a) => a.id === id);
            if (addr) fillFromSaved(addr);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('checkout.store'));
    };

    const canAdvance = (from: Step): boolean => {
        if (from === 'shipping') {
            return !!(data.first_name && data.last_name && data.phone && data.line_1 && data.city && data.state && data.postal_code);
        }
        return true;
    };

    const nextStep = () => {
        const order: Step[] = ['shipping', 'delivery', 'payment', 'review'];
        const i = order.indexOf(step);
        if (i < order.length - 1) setStep(order[i + 1]);
    };

    const prevStep = () => {
        const order: Step[] = ['shipping', 'delivery', 'payment', 'review'];
        const i = order.indexOf(step);
        if (i > 0) setStep(order[i - 1]);
    };

    return (
        <PageLayout breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Cart', href: route('cart.show') }, { label: 'Checkout' }]} showFooter={false}>
            <Head title="Checkout" />

            <Container size="lg" className="py-8">
                <div className="mb-8 flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight text-ink-950">Checkout</h1>
                    <StepIndicator current={step} />
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                        {/* ── Left: step content ─────────────────────────────── */}
                        <div className="lg:col-span-2">
                            {errors.cart && (
                                <div className="mb-4 rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
                                    {errors.cart}
                                </div>
                            )}

                            <AnimatePresence mode="wait">
                                {/* STEP 1: Shipping */}
                                {step === 'shipping' && (
                                    <motion.div key="shipping" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.18 }}>
                                        <Card bordered className="space-y-6">
                                            <div>
                                                <h2 className="text-base font-semibold text-ink-950">Contact & Shipping</h2>
                                                <p className="text-sm text-ink-500">Where should we deliver your order?</p>
                                            </div>

                                            {isGuest && (
                                                <Input
                                                    label="Email address"
                                                    type="email"
                                                    value={String(data.email)}
                                                    onChange={(e) => setData('email', e.target.value)}
                                                    error={errors.email}
                                                    hint="We'll send your order confirmation here."
                                                    required
                                                />
                                            )}

                                            {/* Saved address picker */}
                                            {!isGuest && saved_addresses.length > 0 && (
                                                <div className="space-y-2">
                                                    <p className="text-sm font-medium text-ink-800">Saved addresses</p>
                                                    {saved_addresses.map((addr) => (
                                                        <label key={addr.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors ${selectedSavedAddress === addr.id ? 'border-brand-500 bg-brand-50' : 'border-ink-200 hover:border-ink-300'}`}>
                                                            <input type="radio" name="saved_addr" checked={selectedSavedAddress === addr.id} onChange={() => handleSavedAddressSelect(addr.id)} className="mt-0.5 text-brand-500" />
                                                            <div>
                                                                <p className="text-sm font-medium text-ink-900">{addr.first_name} {addr.last_name}</p>
                                                                <p className="text-xs text-ink-500">{addr.line_1}, {addr.city}, {addr.state}</p>
                                                                {addr.label && <span className="mt-1 inline-block rounded bg-ink-100 px-1.5 py-0.5 text-[10px] text-ink-500">{addr.label}</span>}
                                                            </div>
                                                        </label>
                                                    ))}
                                                    <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition-colors ${selectedSavedAddress === 'new' ? 'border-brand-500 bg-brand-50' : 'border-ink-200 hover:border-ink-300'}`}>
                                                        <input type="radio" name="saved_addr" checked={selectedSavedAddress === 'new'} onChange={() => handleSavedAddressSelect('new')} className="text-brand-500" />
                                                        <span className="text-sm text-ink-700">Use a new address</span>
                                                    </label>
                                                </div>
                                            )}

                                            {/* Address form — always shown for guests, shown for "new" for auth */}
                                            {(isGuest || selectedSavedAddress === 'new') && (
                                                <AddressForm
                                                    values={data as Record<string, string>}
                                                    errors={errors}
                                                    onChange={(field, value) => setData(field as keyof typeof data, value)}
                                                />
                                            )}
                                        </Card>
                                    </motion.div>
                                )}

                                {/* STEP 2: Delivery */}
                                {step === 'delivery' && (
                                    <motion.div key="delivery" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.18 }}>
                                        <Card bordered className="space-y-4">
                                            <div>
                                                <h2 className="text-base font-semibold text-ink-950">Delivery Method</h2>
                                                <p className="text-sm text-ink-500">How should we ship your order?</p>
                                            </div>
                                            <label className="flex cursor-pointer items-center gap-4 rounded-xl border border-brand-500 bg-brand-50 p-4">
                                                <input type="radio" checked readOnly className="text-brand-500" />
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold text-ink-900">Standard Delivery</p>
                                                    <p className="text-xs text-ink-500">3–5 business days · Free over ₱1,500</p>
                                                </div>
                                                <span className="text-sm font-semibold text-ink-950">
                                                    {cart.totals.shipping_cents === 0 ? 'Free' : formatPrice(cart.totals.shipping_cents)}
                                                </span>
                                            </label>
                                        </Card>
                                    </motion.div>
                                )}

                                {/* STEP 3: Payment */}
                                {step === 'payment' && (
                                    <motion.div key="payment" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.18 }}>
                                        <Card bordered className="space-y-4">
                                            <div>
                                                <h2 className="text-base font-semibold text-ink-950">Payment Method</h2>
                                                <p className="text-sm text-ink-500">Choose how you'd like to pay.</p>
                                            </div>
                                            <div className="space-y-2">
                                                {payment_methods.map((pm) => (
                                                    <label key={pm.value} className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-colors ${data.payment_method === pm.value ? 'border-brand-500 bg-brand-50' : 'border-ink-200 hover:border-ink-300'}`}>
                                                        <input
                                                            type="radio"
                                                            name="payment_method"
                                                            value={pm.value}
                                                            checked={data.payment_method === pm.value}
                                                            onChange={() => setData('payment_method', pm.value)}
                                                            className="text-brand-500"
                                                        />
                                                        <div>
                                                            <p className="text-sm font-semibold text-ink-900">{pm.label}</p>
                                                            <p className="text-xs text-ink-500">{pm.description}</p>
                                                        </div>
                                                        <Badge variant="subtle" size="sm" className="ml-auto">Available</Badge>
                                                    </label>
                                                ))}
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-ink-800">Order notes (optional)</label>
                                                <textarea
                                                    value={String(data.notes)}
                                                    onChange={(e) => setData('notes', e.target.value)}
                                                    rows={3}
                                                    placeholder="Special delivery instructions…"
                                                    className="mt-1.5 w-full rounded-lg border border-ink-200 bg-surface px-3 py-2 text-sm placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                                />
                                            </div>
                                        </Card>
                                    </motion.div>
                                )}

                                {/* STEP 4: Review */}
                                {step === 'review' && (
                                    <motion.div key="review" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.18 }}>
                                        <div className="space-y-4">
                                            <Card bordered padding="sm">
                                                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-ink-400">Shipping to</p>
                                                <p className="text-sm font-medium text-ink-900">{String(data.first_name)} {String(data.last_name)}</p>
                                                <p className="text-sm text-ink-600">{String(data.line_1)}{data.line_2 ? `, ${data.line_2}` : ''}</p>
                                                <p className="text-sm text-ink-600">{String(data.city)}, {String(data.state)} {String(data.postal_code)}</p>
                                                <p className="text-sm text-ink-500">{String(data.phone)}</p>
                                                {isGuest && <p className="mt-1 text-sm text-ink-500">{String(data.email)}</p>}
                                            </Card>

                                            <Card bordered padding="sm">
                                                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-ink-400">Payment method</p>
                                                <p className="text-sm font-medium text-ink-900">
                                                    {payment_methods.find((m) => m.value === data.payment_method)?.label}
                                                </p>
                                            </Card>

                                            <p className="text-xs text-ink-400">
                                                By placing your order you agree to our Terms of Service and Privacy Policy.
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Step navigation */}
                            <div className="mt-6 flex items-center justify-between">
                                <div>
                                    {step !== 'shipping' && (
                                        <Button type="button" variant="ghost" onClick={prevStep}>
                                            ← Back
                                        </Button>
                                    )}
                                </div>
                                <div>
                                    {step !== 'review' ? (
                                        <Button
                                            type="button"
                                            onClick={nextStep}
                                            disabled={!canAdvance(step)}
                                        >
                                            Continue →
                                        </Button>
                                    ) : (
                                        <Button
                                            type="submit"
                                            size="lg"
                                            loading={processing}
                                        >
                                            Place Order · {formatPrice(cart.totals.total_cents)}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── Right: order summary ───────────────────────────── */}
                        <div>
                            <div className="sticky top-24 rounded-2xl border border-ink-200 bg-surface p-5">
                                <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-ink-400">
                                    Your Order
                                </h2>
                                <OrderSummary cart={cart} />
                            </div>
                        </div>
                    </div>
                </form>
            </Container>
        </PageLayout>
    );
}
