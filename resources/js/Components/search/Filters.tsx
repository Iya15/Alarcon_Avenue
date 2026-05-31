import Button from '@/Components/ui/Button';
import Drawer from '@/Components/ui/Drawer';
import { cn } from '@/lib/cn';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import PriceRange from './PriceRange';

interface Facets {
    categories: { id: number; name: string; count: number }[];
    brands:     { id: number; name: string; count: number }[];
    colors:    Record<string, number>;
    sizes:     Record<string, number>;
    materials: Record<string, number>;
    in_stock:    number;
    has_discount: number;
    price_min: number;
    price_max: number;
}

interface ActiveFilters {
    q?:           string;
    sort?:        string;
    categories?:  number[];
    brand_ids?:   number[];
    colors?:      string[];
    sizes?:       string[];
    materials?:   string[];
    in_stock?:    boolean;
    has_discount?: boolean;
    price_min?:   number;
    price_max?:   number;
    rating_min?:  number;
}

interface Props {
    facets:        Facets;
    activeFilters: ActiveFilters;
    mobileOpen:    boolean;
    onMobileClose: () => void;
}

// ── Collapsible section with optional selected-count badge ────────────────────

function Section({
    title,
    selectedCount = 0,
    onClear,
    children,
    defaultOpen = true,
}: {
    title: string;
    selectedCount?: number;
    onClear?: () => void;
    children: React.ReactNode;
    defaultOpen?: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className="border-b border-ink-100 py-4 last:border-b-0">
            <div className="flex items-center justify-between">
                <button
                    onClick={() => setOpen((v) => !v)}
                    className="flex flex-1 items-center gap-2 text-sm font-semibold text-ink-900"
                >
                    {title}
                    {selectedCount > 0 && (
                        <span className="rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">
                            {selectedCount}
                        </span>
                    )}
                    <svg
                        className={cn('ml-auto h-4 w-4 text-ink-400 transition-transform', open && 'rotate-180')}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {selectedCount > 0 && onClear && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onClear(); }}
                        className="ml-2 text-xs text-ink-400 hover:text-brand shrink-0"
                    >
                        Clear
                    </button>
                )}
            </div>

            {open && <div className="mt-3">{children}</div>}
        </div>
    );
}

// ── Multi-select checkbox row (Category / Brand / Materials) ──────────────────

function MultiCheckRow({
    label,
    count,
    checked,
    onChange,
}: {
    label: string;
    count: number;
    checked: boolean;
    onChange: () => void;
}) {
    return (
        <label
            className={cn(
                'flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-1.5 transition-colors',
                checked ? 'bg-brand/8 text-brand-700' : 'hover:bg-ink-50',
            )}
        >
            <div className="flex items-center gap-2.5">
                <div
                    className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors',
                        checked
                            ? 'border-brand bg-brand'
                            : 'border-ink-300 bg-white',
                    )}
                >
                    {checked && (
                        <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                </div>
                <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
                <span className={cn('text-sm', checked ? 'font-medium text-brand-700' : 'text-ink-700')}>
                    {label}
                </span>
            </div>
            <span className={cn('text-xs tabular-nums', checked ? 'text-brand-500' : 'text-ink-400')}>
                {count}
            </span>
        </label>
    );
}

// ── Boolean toggle row (In Stock / On Sale / Rating) ──────────────────────────

function ToggleRow({
    label,
    count,
    checked,
    onChange,
}: {
    label: string;
    count: number;
    checked: boolean;
    onChange: () => void;
}) {
    return (
        <label
            className={cn(
                'flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-1.5 transition-colors',
                checked ? 'bg-brand/8' : 'hover:bg-ink-50',
            )}
        >
            <div className="flex items-center gap-2.5">
                <div
                    className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors',
                        checked ? 'border-brand bg-brand' : 'border-ink-300 bg-white',
                    )}
                >
                    {checked && (
                        <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                </div>
                <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
                <span className={cn('text-sm', checked ? 'font-medium text-brand-700' : 'text-ink-700')}>{label}</span>
            </div>
            {count > 0 && (
                <span className={cn('text-xs tabular-nums', checked ? 'text-brand-500' : 'text-ink-400')}>{count}</span>
            )}
        </label>
    );
}

// ── State management + navigation helpers ─────────────────────────────────────

function buildParams(f: ActiveFilters): Record<string, unknown> {
    const p: Record<string, unknown> = {};
    if (f.q)               p.q            = f.q;
    if (f.sort && f.sort !== 'relevance') p.sort = f.sort;
    if (f.categories?.length)  p.categories  = f.categories;
    if (f.brand_ids?.length)   p.brand_ids   = f.brand_ids;
    if (f.colors?.length)      p.colors      = f.colors;
    if (f.sizes?.length)       p.sizes       = f.sizes;
    if (f.materials?.length)   p.materials   = f.materials;
    if (f.in_stock)            p.in_stock    = 1;
    if (f.has_discount)        p.has_discount = 1;
    if (f.price_min)           p.price_min   = f.price_min;
    if (f.price_max)           p.price_max   = f.price_max;
    if (f.rating_min)          p.rating_min  = f.rating_min;
    return p;
}

function useFilterState(activeFilters: ActiveFilters, isMobile: boolean) {
    const [pending, setPending] = useState<ActiveFilters>(activeFilters);

    const applyImmediate = (filters: ActiveFilters) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.get('/search', buildParams(filters) as any, {
            preserveScroll: true,
            only: ['results', 'pagination', 'facets', 'filters'],
        });

    // Toggle a value in an array field (categories, brand_ids, colors, sizes, materials).
    // Uses String() comparison so number 1 matches string '1' — prevents the bug where
    // URL params arrive from PHP as strings but facet IDs are JS numbers, causing the
    // toggle to always ADD instead of removing the existing selection.
    const toggle = (key: keyof ActiveFilters, value: number | string) => {
        const update = (prev: ActiveFilters): ActiveFilters => {
            const current = (prev[key] as (number | string)[]) ?? [];
            const strVal  = String(value);
            const isActive = current.some((v) => String(v) === strVal);
            const next = isActive
                ? current.filter((v) => String(v) !== strVal)
                : [...current, value];
            return { ...prev, [key]: next.length ? next : undefined };
        };
        if (!isMobile) applyImmediate(update(activeFilters));
        else setPending(update);
    };

    // Clear an entire filter key (e.g. remove all selected categories)
    const clearKey = (key: keyof ActiveFilters) => {
        const update = (prev: ActiveFilters): ActiveFilters => ({ ...prev, [key]: undefined });
        if (!isMobile) applyImmediate(update(activeFilters));
        else setPending(update);
    };

    const setBool = (key: 'in_stock' | 'has_discount', value: boolean) => {
        const update = (prev: ActiveFilters): ActiveFilters => ({ ...prev, [key]: value || undefined });
        if (!isMobile) applyImmediate(update(activeFilters));
        else setPending(update);
    };

    const setPrice = (range: [number, number], facets: { price_min: number; price_max: number }) => {
        const val = {
            price_min: range[0] !== facets.price_min ? range[0] : undefined,
            price_max: range[1] !== facets.price_max ? range[1] : undefined,
        };
        if (!isMobile) applyImmediate({ ...activeFilters, ...val });
        else setPending((p) => ({ ...p, ...val }));
    };

    const applyPending = () => applyImmediate(pending);

    return { pending, toggle, clearKey, setBool, setPrice, applyPending };
}

// ── Expandable list (show 5 by default, "Show more" to reveal all) ────────────

function ExpandableList<T>({
    items,
    limit = 5,
    renderItem,
}: {
    items: T[];
    limit?: number;
    renderItem: (item: T, index: number) => React.ReactNode;
}) {
    const [expanded, setExpanded] = useState(false);
    const visible = expanded ? items : items.slice(0, limit);
    const hasMore = items.length > limit;

    return (
        <div>
            <div className="space-y-0.5">
                {visible.map((item, i) => renderItem(item, i))}
            </div>
            {hasMore && (
                <button
                    onClick={() => setExpanded((v) => !v)}
                    className="mt-2 flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-brand"
                >
                    {expanded ? (
                        <>
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                            </svg>
                            Show less
                        </>
                    ) : (
                        <>
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                            Show {items.length - limit} more
                        </>
                    )}
                </button>
            )}
        </div>
    );
}

// ── Main filter body ───────────────────────────────────────────────────────────

function FilterBody({
    facets,
    activeFilters,
    isMobile,
    onApply,
}: {
    facets:        Facets;
    activeFilters: ActiveFilters;
    isMobile:      boolean;
    onApply?:      () => void;
}) {
    const { pending, toggle, clearKey, setBool, setPrice, applyPending } = useFilterState(activeFilters, isMobile);
    const ef = isMobile ? pending : activeFilters;

    const hasChange = isMobile && JSON.stringify(pending) !== JSON.stringify(activeFilters);

    const selectedCatCount   = (ef.categories ?? []).length;
    const selectedBrandCount = (ef.brand_ids ?? []).length;
    const selectedColorCount = (ef.colors ?? []).length;
    const selectedSizeCount  = (ef.sizes ?? []).length;
    const selectedMatCount   = (ef.materials ?? []).length;

    return (
        <div className="flex flex-col gap-0">

            {/* ── Price ──────────────────────────────────────────────────── */}
            {facets.price_max > 0 && (
                <Section title="Price">
                    <PriceRange
                        min={facets.price_min}
                        max={facets.price_max}
                        value={[ef.price_min ?? facets.price_min, ef.price_max ?? facets.price_max]}
                        onChange={(r) => setPrice(r, facets)}
                    />
                </Section>
            )}

            {/* ── Category — multi-select ─────────────────────────────────── */}
            {facets.categories.length > 0 && (
                <Section
                    title="Category"
                    selectedCount={selectedCatCount}
                    onClear={() => clearKey('categories')}
                >
                    {selectedCatCount > 0 && (
                        <p className="mb-2 text-xs text-ink-400">
                            {selectedCatCount} selected — you can pick multiple
                        </p>
                    )}
                    <ExpandableList
                        items={facets.categories}
                        renderItem={(c) => (
                            <MultiCheckRow
                                key={c.id}
                                label={c.name}
                                count={c.count}
                                checked={(ef.categories ?? []).some((v) => String(v) === String(c.id))}
                                onChange={() => toggle('categories', c.id)}
                            />
                        )}
                    />
                </Section>
            )}

            {/* ── Brand — multi-select ────────────────────────────────────── */}
            {facets.brands.length > 0 && (
                <Section
                    title="Brand"
                    selectedCount={selectedBrandCount}
                    onClear={() => clearKey('brand_ids')}
                >
                    {selectedBrandCount > 0 && (
                        <p className="mb-2 text-xs text-ink-400">
                            {selectedBrandCount} selected — you can pick multiple
                        </p>
                    )}
                    <ExpandableList
                        items={facets.brands}
                        renderItem={(b) => (
                            <MultiCheckRow
                                key={b.id}
                                label={b.name}
                                count={b.count}
                                checked={(ef.brand_ids ?? []).some((v) => String(v) === String(b.id))}
                                onChange={() => toggle('brand_ids', b.id)}
                            />
                        )}
                    />
                </Section>
            )}

            {/* ── Color — multi-select swatches ───────────────────────────── */}
            {Object.keys(facets.colors).length > 0 && (
                <Section
                    title="Color"
                    selectedCount={selectedColorCount}
                    onClear={() => clearKey('colors')}
                >
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(facets.colors).map(([color, count]) => {
                            const active = (ef.colors ?? []).includes(color);
                            return (
                                <button
                                    key={color}
                                    onClick={() => toggle('colors', color)}
                                    title={`${color} (${count})`}
                                    className={cn(
                                        'h-7 w-7 rounded-full border-2 transition-all',
                                        active
                                            ? 'border-brand ring-2 ring-brand ring-offset-1 scale-110'
                                            : 'border-ink-200 hover:border-ink-400',
                                    )}
                                    style={{ backgroundColor: color.startsWith('#') ? color : undefined }}
                                >
                                    {!color.startsWith('#') && (
                                        <span className="text-[9px] font-medium text-ink-700">
                                            {color.slice(0, 2).toUpperCase()}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </Section>
            )}

            {/* ── Size — multi-select pill buttons ────────────────────────── */}
            {Object.keys(facets.sizes).length > 0 && (
                <Section
                    title="Size"
                    selectedCount={selectedSizeCount}
                    onClear={() => clearKey('sizes')}
                >
                    <div className="flex flex-wrap gap-1.5">
                        {Object.entries(facets.sizes).map(([size, count]) => {
                            const active = (ef.sizes ?? []).includes(size);
                            return (
                                <button
                                    key={size}
                                    onClick={() => toggle('sizes', size)}
                                    className={cn(
                                        'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                                        active
                                            ? 'border-brand bg-brand/10 text-brand-700'
                                            : 'border-ink-200 text-ink-600 hover:border-ink-400',
                                    )}
                                >
                                    {size.toUpperCase()}
                                    <span className={cn('ml-1 font-normal', active ? 'text-brand-500' : 'text-ink-400')}>
                                        ({count})
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </Section>
            )}

            {/* ── Material — multi-select checkboxes ──────────────────────── */}
            {Object.keys(facets.materials).length > 0 && (
                <Section
                    title="Material"
                    selectedCount={selectedMatCount}
                    onClear={() => clearKey('materials')}
                >
                    <ExpandableList
                        items={Object.entries(facets.materials)}
                        renderItem={([material, count]) => (
                            <MultiCheckRow
                                key={material}
                                label={material}
                                count={count}
                                checked={(ef.materials ?? []).includes(material)}
                                onChange={() => toggle('materials', material)}
                            />
                        )}
                    />
                </Section>
            )}

            {/* ── Availability & Offers — boolean toggles ──────────────────── */}
            {(facets.in_stock > 0 || facets.has_discount > 0) && (
                <Section title="Availability & Offers">
                    <div className="space-y-0.5">
                        {facets.in_stock > 0 && (
                            <ToggleRow
                                label="In Stock"
                                count={facets.in_stock}
                                checked={ef.in_stock ?? false}
                                onChange={() => setBool('in_stock', !(ef.in_stock ?? false))}
                            />
                        )}
                        {facets.has_discount > 0 && (
                            <ToggleRow
                                label="On Sale"
                                count={facets.has_discount}
                                checked={ef.has_discount ?? false}
                                onChange={() => setBool('has_discount', !(ef.has_discount ?? false))}
                            />
                        )}
                    </div>
                </Section>
            )}

            {/* ── Rating — radio (single selection) ───────────────────────── */}
            <Section title="Rating" defaultOpen={false}>
                <div className="space-y-0.5">
                    {[4, 3, 2].map((min) => {
                        const active = ef.rating_min === min;
                        return (
                            <label
                                key={min}
                                className={cn(
                                    'flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors',
                                    active ? 'bg-brand/8' : 'hover:bg-ink-50',
                                )}
                            >
                                <div
                                    className={cn(
                                        'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                                        active ? 'border-brand bg-brand' : 'border-ink-300 bg-white',
                                    )}
                                >
                                    {active && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                                </div>
                                <input
                                    type="radio"
                                    name="rating_min"
                                    checked={active}
                                    onChange={() => {
                                        const filters = { ...activeFilters, rating_min: active ? undefined : min };
                                        if (!isMobile) {
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            router.get('/search', buildParams(filters) as any, {
                                                preserveScroll: true,
                                                only: ['results', 'pagination', 'facets', 'filters'],
                                            });
                                        }
                                    }}
                                    className="sr-only"
                                />
                                <div className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <svg
                                            key={s}
                                            className={cn('h-3.5 w-3.5', s <= min ? 'text-brand' : 'text-ink-200')}
                                            fill="currentColor" viewBox="0 0 20 20"
                                        >
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    ))}
                                    <span className={cn('ml-1 text-xs', active ? 'font-medium text-brand-700' : 'text-ink-500')}>
                                        & up
                                    </span>
                                </div>
                            </label>
                        );
                    })}
                </div>
            </Section>

            {/* ── Mobile apply button ──────────────────────────────────────── */}
            {isMobile && hasChange && (
                <div className="sticky bottom-0 border-t border-ink-100 bg-surface p-3">
                    <Button fullWidth onClick={() => { applyPending(); onApply?.(); }}>
                        Apply filters
                    </Button>
                </div>
            )}
        </div>
    );
}

// ── Public component ──────────────────────────────────────────────────────────

export default function Filters({ facets, activeFilters, mobileOpen, onMobileClose }: Props) {
    return (
        <>
            {/* Desktop sidebar */}
            <aside className="hidden w-60 shrink-0 lg:block">
                <div className="sticky top-24">
                    <h2 className="mb-2 text-sm font-semibold text-ink-900">Filters</h2>
                    <FilterBody facets={facets} activeFilters={activeFilters} isMobile={false} />
                </div>
            </aside>

            {/* Mobile drawer */}
            <Drawer open={mobileOpen} onClose={onMobileClose} side="left" title="Filters" size="md">
                <FilterBody facets={facets} activeFilters={activeFilters} isMobile onApply={onMobileClose} />
            </Drawer>
        </>
    );
}
