import Badge from '@/Components/ui/Badge';
import Button from '@/Components/ui/Button';
import Card from '@/Components/ui/Card';
import Checkbox from '@/Components/ui/Checkbox';
import Drawer from '@/Components/ui/Drawer';
import EmptyState from '@/Components/ui/EmptyState';
import ErrorState from '@/Components/ui/ErrorState';
import Input from '@/Components/ui/Input';
import Modal from '@/Components/ui/Modal';
import Select from '@/Components/ui/Select';
import Skeleton from '@/Components/ui/Skeleton';
import Spinner from '@/Components/ui/Spinner';
import { Toaster } from '@/Components/ui/Toast';
import Tooltip from '@/Components/ui/Tooltip';
import Breadcrumbs from '@/Components/layout/Breadcrumbs';
import Container from '@/Components/layout/Container';
import { useToast } from '@/stores/toastStore';
import { Head } from '@inertiajs/react';
import { useState } from 'react';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="border-t border-ink-100 py-12 first:border-t-0 first:pt-0">
            <h2 className="mb-8 text-2xl font-bold tracking-tight text-ink-950">{title}</h2>
            {children}
        </section>
    );
}

function Row({ label, children }: { label?: string; children: React.ReactNode }) {
    return (
        <div className="mb-6">
            {label && <p className="mb-3 text-xs font-medium uppercase tracking-widest text-ink-400">{label}</p>}
            <div className="flex flex-wrap items-center gap-3">{children}</div>
        </div>
    );
}

export default function Styleguide() {
    const [modalOpen, setModalOpen] = useState(false);
    const [drawerOpen, setDrawerOpen]   = useState<'left' | 'right' | 'bottom' | null>(null);
    const [checked, setChecked] = useState(false);
    const toast = useToast();

    return (
        <>
            <Head title="Design System — Alarcon Avenue" />
            <Toaster />

            <div className="min-h-screen bg-canvas">
                {/* Header */}
                <div className="border-b border-ink-200 bg-surface">
                    <Container>
                        <div className="py-10">
                            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-brand-500">
                                Alarcon Avenue
                            </p>
                            <h1 className="text-4xl font-bold tracking-tight text-ink-950">
                                Design System
                            </h1>
                            <p className="mt-2 text-base text-ink-500">
                                All components, tokens, and states. Black · White · #e7901d.
                            </p>
                        </div>
                    </Container>
                </div>

                <Container className="py-12">

                    {/* ── COLOR TOKENS ─────────────────────────────────── */}
                    <Section title="Color Tokens">
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {[
                                { name: 'Ink', prefix: 'ink' },
                                { name: 'Brand', prefix: 'brand' },
                            ].map(({ name, prefix }) => (
                                <div key={prefix}>
                                    <p className="mb-3 text-sm font-semibold text-ink-900">{name}</p>
                                    <div className="overflow-hidden rounded-xl border border-ink-200">
                                        {[50,100,200,300,400,500,600,700,800,900,950].map((shade) => (
                                            <div
                                                key={shade}
                                                className={`flex h-9 items-center justify-between px-3 bg-${prefix}-${shade}`}
                                            >
                                                <span className={`text-xs font-mono ${shade < 500 ? 'text-ink-700' : 'text-white/80'}`}>
                                                    {prefix}-{shade}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            <div>
                                <p className="mb-3 text-sm font-semibold text-ink-900">Status (Option B)</p>
                                <div className="overflow-hidden rounded-xl border border-ink-200">
                                    {[
                                        { label: 'success-100', cls: 'bg-success-100', light: true },
                                        { label: 'success-600', cls: 'bg-success-600', light: false },
                                        { label: 'danger-100',  cls: 'bg-danger-100',  light: true },
                                        { label: 'danger-600',  cls: 'bg-danger-600',  light: false },
                                        { label: 'brand-100',   cls: 'bg-brand-100',   light: true },
                                        { label: 'brand-500',   cls: 'bg-brand-500',   light: false },
                                    ].map(({ label, cls, light }) => (
                                        <div key={label} className={`flex h-9 items-center px-3 ${cls}`}>
                                            <span className={`text-xs font-mono ${light ? 'text-ink-700' : 'text-white/80'}`}>
                                                {label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Section>

                    {/* ── TYPOGRAPHY ───────────────────────────────────── */}
                    <Section title="Typography">
                        {([
                            ['text-xs', 'Caption — Figtree 11px'],
                            ['text-sm', 'Label / Secondary — Figtree 13px'],
                            ['text-base', 'Body — Figtree 15px'],
                            ['text-lg', 'Emphasized body — Figtree 17px'],
                            ['text-xl', 'Section heading — Figtree 20px'],
                            ['text-2xl', 'Page subheading — Figtree 24px'],
                            ['text-3xl', 'Page heading — Figtree 30px'],
                            ['text-4xl', 'Hero subheadline — Figtree 38px'],
                            ['text-5xl', 'Hero headline — Figtree 48px'],
                        ] as [string, string][]).map(([cls, label]) => (
                            <p key={cls} className={`${cls} font-medium tracking-tight text-ink-950 leading-tight mb-2`}>
                                {label}
                            </p>
                        ))}
                    </Section>

                    {/* ── BUTTONS ──────────────────────────────────────── */}
                    <Section title="Button">
                        <Row label="Variants">
                            <Button variant="primary">Primary</Button>
                            <Button variant="secondary">Secondary</Button>
                            <Button variant="ghost">Ghost</Button>
                            <Button variant="danger">Danger</Button>
                            <Button variant="link">Link</Button>
                        </Row>
                        <Row label="Sizes">
                            <Button size="sm">Small</Button>
                            <Button size="md">Medium</Button>
                            <Button size="lg">Large</Button>
                            <Button size="xl">XL</Button>
                        </Row>
                        <Row label="States">
                            <Button loading>Loading</Button>
                            <Button disabled>Disabled</Button>
                            <Button
                                icon={
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                    </svg>
                                }
                            >
                                With icon
                            </Button>
                            <Button variant="secondary" fullWidth>Full width</Button>
                        </Row>
                    </Section>

                    {/* ── INPUTS ───────────────────────────────────────── */}
                    <Section title="Input">
                        <div className="grid max-w-lg grid-cols-1 gap-5">
                            <Input label="Default" placeholder="Enter value…" />
                            <Input label="With hint" hint="We'll never share your email." placeholder="email@example.com" />
                            <Input label="With error" error="This field is required." placeholder="Enter value…" />
                            <Input
                                label="With icon"
                                placeholder="Search…"
                                icon={
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                    </svg>
                                }
                            />
                            <Input label="With prefix" prefix="PHP" placeholder="0.00" />
                            <Input label="Loading" loading placeholder="Fetching…" />
                        </div>
                    </Section>

                    {/* ── SELECT ───────────────────────────────────────── */}
                    <Section title="Select">
                        <div className="max-w-xs">
                            <Select
                                label="Category"
                                placeholder="Choose a category"
                                options={[
                                    { value: 'clothing', label: 'Clothing' },
                                    { value: 'footwear', label: 'Footwear' },
                                    { value: 'accessories', label: 'Accessories' },
                                ]}
                            />
                        </div>
                    </Section>

                    {/* ── CHECKBOX ─────────────────────────────────────── */}
                    <Section title="Checkbox">
                        <Row>
                            <Checkbox
                                label="Agree to terms"
                                checked={checked}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setChecked(e.target.checked)}
                            />
                            <Checkbox
                                label="With description"
                                description="Receive marketing emails about products."
                            />
                            <Checkbox
                                label="Error state"
                                error="Please accept to continue."
                            />
                            <Checkbox label="Disabled" disabled />
                            <Checkbox label="Indeterminate" indeterminate />
                        </Row>
                    </Section>

                    {/* ── BADGES ───────────────────────────────────────── */}
                    <Section title="Badge">
                        <Row label="Variants">
                            <Badge>Default</Badge>
                            <Badge variant="brand">Brand</Badge>
                            <Badge variant="inverted">Inverted</Badge>
                            <Badge variant="subtle">Subtle</Badge>
                            <Badge variant="outline">Outline</Badge>
                            <Badge variant="success">Success</Badge>
                            <Badge variant="danger">Danger</Badge>
                            <Badge variant="warning">Warning</Badge>
                        </Row>
                        <Row label="With dot">
                            <Badge dot>In Stock</Badge>
                            <Badge variant="success" dot>Available</Badge>
                            <Badge variant="danger" dot>Sold Out</Badge>
                        </Row>
                        <Row label="Sizes">
                            <Badge size="sm">Small</Badge>
                            <Badge size="md">Medium</Badge>
                        </Row>
                    </Section>

                    {/* ── SPINNER ──────────────────────────────────────── */}
                    <Section title="Spinner">
                        <Row>
                            <Spinner size="xs" />
                            <Spinner size="sm" />
                            <Spinner size="md" />
                            <Spinner size="lg" />
                        </Row>
                    </Section>

                    {/* ── CARD ─────────────────────────────────────────── */}
                    <Section title="Card">
                        <div className="grid gap-4 sm:grid-cols-3">
                            <Card>
                                <p className="text-sm font-semibold text-ink-900">Default card</p>
                                <p className="mt-1 text-sm text-ink-500">Shadow variant with medium padding.</p>
                            </Card>
                            <Card bordered>
                                <p className="text-sm font-semibold text-ink-900">Bordered card</p>
                                <p className="mt-1 text-sm text-ink-500">Border instead of shadow.</p>
                            </Card>
                            <Card hoverable>
                                <p className="text-sm font-semibold text-ink-900">Hoverable card</p>
                                <p className="mt-1 text-sm text-ink-500">Lifts 2px with Framer Motion on hover.</p>
                            </Card>
                        </div>
                    </Section>

                    {/* ── TOOLTIP ──────────────────────────────────────── */}
                    <Section title="Tooltip">
                        <Row label="Positions">
                            <Tooltip content="Top tooltip" side="top">
                                <Button variant="secondary" size="sm">Top</Button>
                            </Tooltip>
                            <Tooltip content="Bottom tooltip" side="bottom">
                                <Button variant="secondary" size="sm">Bottom</Button>
                            </Tooltip>
                            <Tooltip content="Left tooltip" side="left">
                                <Button variant="secondary" size="sm">Left</Button>
                            </Tooltip>
                            <Tooltip content="Right tooltip" side="right">
                                <Button variant="secondary" size="sm">Right</Button>
                            </Tooltip>
                        </Row>
                    </Section>

                    {/* ── SKELETON ─────────────────────────────────────── */}
                    <Section title="Skeleton">
                        <div className="grid gap-6 sm:grid-cols-3">
                            <div className="space-y-2">
                                <p className="text-xs font-medium uppercase tracking-widest text-ink-400">Text</p>
                                <Skeleton.Text lines={3} />
                            </div>
                            <div className="space-y-2">
                                <p className="text-xs font-medium uppercase tracking-widest text-ink-400">Avatar + text</p>
                                <div className="flex gap-3">
                                    <Skeleton.Avatar size={40} />
                                    <div className="flex-1">
                                        <Skeleton height="0.875rem" width="50%" className="mb-2" />
                                        <Skeleton height="0.75rem" width="70%" />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-xs font-medium uppercase tracking-widest text-ink-400">Card</p>
                                <Skeleton.Card />
                            </div>
                        </div>
                    </Section>

                    {/* ── EMPTY STATE ──────────────────────────────────── */}
                    <Section title="EmptyState">
                        <div className="grid gap-6 sm:grid-cols-2">
                            <Card bordered padding="none">
                                <EmptyState
                                    icon={
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                        </svg>
                                    }
                                    title="Your cart is empty"
                                    description="Add items to your cart to see them here."
                                    action={<Button size="sm">Browse products</Button>}
                                />
                            </Card>
                            <Card bordered padding="none">
                                <EmptyState
                                    title="No results found"
                                    description="Try adjusting your search or filters to find what you're looking for."
                                    size="sm"
                                />
                            </Card>
                        </div>
                    </Section>

                    {/* ── ERROR STATE ──────────────────────────────────── */}
                    <Section title="ErrorState">
                        <div className="grid gap-6 sm:grid-cols-2">
                            <Card bordered padding="none">
                                <ErrorState code={404} onRetry={() => {}} />
                            </Card>
                            <Card bordered padding="none">
                                <ErrorState code={500} onRetry={() => {}} />
                            </Card>
                        </div>
                    </Section>

                    {/* ── MODAL ────────────────────────────────────────── */}
                    <Section title="Modal">
                        <Row>
                            <Button onClick={() => setModalOpen(true)}>Open modal</Button>
                        </Row>
                        <Modal
                            open={modalOpen}
                            onClose={() => setModalOpen(false)}
                            title="Confirm action"
                            description="This action cannot be undone. Are you sure you want to proceed?"
                            footer={
                                <>
                                    <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
                                    <Button onClick={() => setModalOpen(false)}>Confirm</Button>
                                </>
                            }
                        >
                            <p className="text-sm text-ink-600">
                                You are about to delete 5 items from your cart. All selected items will be permanently removed.
                            </p>
                        </Modal>
                    </Section>

                    {/* ── DRAWER ───────────────────────────────────────── */}
                    <Section title="Drawer">
                        <Row>
                            <Button variant="secondary" onClick={() => setDrawerOpen('left')}>Left</Button>
                            <Button variant="secondary" onClick={() => setDrawerOpen('right')}>Right</Button>
                            <Button variant="secondary" onClick={() => setDrawerOpen('bottom')}>Bottom</Button>
                        </Row>
                        {(['left', 'right', 'bottom'] as const).map((side) => (
                            <Drawer
                                key={side}
                                open={drawerOpen === side}
                                onClose={() => setDrawerOpen(null)}
                                side={side}
                                title={`${side.charAt(0).toUpperCase() + side.slice(1)} drawer`}
                                footer={
                                    <Button fullWidth onClick={() => setDrawerOpen(null)}>
                                        Done
                                    </Button>
                                }
                            >
                                <p className="text-sm text-ink-600">
                                    Drawer content goes here. This is a {side}-side drawer with smooth Framer Motion animation.
                                </p>
                            </Drawer>
                        ))}
                    </Section>

                    {/* ── TOAST ────────────────────────────────────────── */}
                    <Section title="Toast">
                        <Row>
                            <Button variant="secondary" size="sm" onClick={() => toast({ title: 'Notification', description: 'Default toast message.' })}>
                                Default
                            </Button>
                            <Button variant="secondary" size="sm" onClick={() => toast.success('Saved!', { description: 'Your changes have been saved.' })}>
                                Success
                            </Button>
                            <Button variant="secondary" size="sm" onClick={() => toast.error('Error', { description: 'Something went wrong. Please try again.' })}>
                                Error
                            </Button>
                            <Button variant="secondary" size="sm" onClick={() => toast.warning('Warning', { description: 'This action may have unintended effects.' })}>
                                Warning
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                    const id = toast.loading('Processing…');
                                    setTimeout(() => toast.dismiss(id), 3000);
                                }}
                            >
                                Loading (3s)
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() =>
                                    toast({ title: 'Item added', action: { label: 'View cart', onClick: () => {} } })
                                }
                            >
                                With action
                            </Button>
                        </Row>
                    </Section>

                    {/* ── BREADCRUMBS ──────────────────────────────────── */}
                    <Section title="Breadcrumbs">
                        <Breadcrumbs
                            items={[
                                { label: 'Home', href: '/' },
                                { label: 'Clothing', href: '/categories/clothing' },
                                { label: "Men's", href: '/categories/clothing-mens' },
                                { label: 'T-Shirts' },
                            ]}
                        />
                    </Section>

                    {/* ── LAYOUT SHELL PREVIEW ─────────────────────────── */}
                    <Section title="Layout Shell">
                        <p className="mb-4 text-sm text-ink-500">
                            The full <code className="rounded bg-ink-100 px-1.5 py-0.5 text-xs font-mono">PageLayout</code> wraps every page. On desktop: Navbar with mega-menu + Footer. On mobile: Navbar (hamburger) + sticky MobileActionBar (bottom). Scroll the page to observe the sticky header.
                        </p>
                        <Card bordered padding="sm">
                            <div className="overflow-hidden rounded-lg border border-ink-200 bg-ink-50">
                                <div className="flex h-10 items-center justify-between border-b border-ink-200 bg-surface px-4">
                                    <span className="text-xs font-bold text-ink-950">Alarcon<span className="text-brand-500">.</span></span>
                                    <div className="hidden gap-4 sm:flex">
                                        <span className="text-xs text-ink-500">Shop</span>
                                        <span className="text-xs text-ink-500">New Arrivals</span>
                                        <span className="text-xs text-brand-600">Sale</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="h-4 w-4 rounded bg-ink-200" />
                                        <span className="h-4 w-4 rounded bg-ink-200" />
                                        <span className="h-4 w-8 rounded bg-brand-500" />
                                    </div>
                                </div>
                                <div className="flex h-32 items-center justify-center">
                                    <span className="text-xs text-ink-400">Page content</span>
                                </div>
                                <div className="border-t border-ink-200 bg-surface p-3">
                                    <div className="grid grid-cols-4 gap-2">
                                        {['Shop', 'Company', 'Account', 'Legal'].map((col) => (
                                            <div key={col}>
                                                <p className="mb-1 text-[10px] font-bold uppercase text-ink-400">{col}</p>
                                                <div className="space-y-1">
                                                    {[1, 2, 3].map((i) => (
                                                        <div key={i} className="h-2 rounded bg-ink-100" />
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex h-8 items-center justify-around border-t border-ink-200 bg-surface sm:hidden">
                                    {['Home', 'Browse', 'Search', 'Cart', 'Account'].map((tab) => (
                                        <div key={tab} className="flex flex-col items-center gap-0.5">
                                            <div className="h-3 w-3 rounded-sm bg-ink-200" />
                                            <span className="text-[8px] text-ink-400">{tab}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    </Section>

                </Container>
            </div>
        </>
    );
}
