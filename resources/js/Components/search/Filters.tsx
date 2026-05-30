import Button from '@/Components/ui/Button';
import Drawer from '@/Components/ui/Drawer';
import { cn } from '@/lib/cn';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import PriceRange from './PriceRange';

interface FacetItem { id?: number; name?: string; value?: string; count: number; hex?: string }

interface Facets {
    categories: { id: number; name: string; count: number }[];
    brands: { id: number; name: string; count: number }[];
    colors: Record<string, number>;
    sizes: Record<string, number>;
    materials: Record<string, number>;
    in_stock: number;
    has_discount: number;
    price_min: number;
    price_max: number;
}

interface ActiveFilters {
    q?: string;
    sort?: string;
    categories?: number[];
    brand_ids?: number[];
    colors?: string[];
    sizes?: string[];
    materials?: string[];
    in_stock?: boolean;
    has_discount?: boolean;
    price_min?: number;
    price_max?: number;
    rating_min?: number;
}

interface Props {
    facets: Facets;
    activeFilters: ActiveFilters;
    mobileOpen: boolean;
    onMobileClose: () => void;
}

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border-b border-ink-100 py-4 last:border-b-0">
            <button
                onClick={() => setOpen((v) => !v)}
                className="flex w-full items-center justify-between text-sm font-semibold text-ink-900"
            >
                {title}
                <svg className={cn('h-4 w-4 text-ink-400 transition-transform', open && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {open && <div className="mt-3">{children}</div>}
        </div>
    );
}

function CheckboxItem({ label, count, checked, onChange }: { label: string; count: number; checked: boolean; onChange: () => void }) {
    return (
        <label className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-1 py-1.5 hover:bg-ink-50">
            <div className="flex items-center gap-2.5">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={onChange}
                    className="h-3.5 w-3.5 rounded border-ink-300 text-brand-500 focus:ring-brand-500"
                />
                <span className="text-sm text-ink-700">{label}</span>
            </div>
            <span className="text-xs text-ink-400">{count}</span>
        </label>
    );
}

function useFilterState(activeFilters: ActiveFilters, isMobile: boolean) {
    const [pending, setPending] = useState<ActiveFilters>(activeFilters);

    const toggle = <K extends keyof ActiveFilters>(
        key: K,
        value: ActiveFilters[K] extends (infer I)[] | undefined ? I : never,
    ) => {
        if (!isMobile) {
            const current = (activeFilters[key] as unknown[]) ?? [];
            const next = current.includes(value)
                ? current.filter((v) => v !== value)
                : [...current, value];
            applyImmediate({ ...activeFilters, [key]: next.length ? next : undefined });
        } else {
            setPending((prev) => {
                const current = ((prev[key] as unknown[]) ?? []) as typeof value[];
                const next = current.includes(value)
                    ? current.filter((v) => v !== value)
                    : [...current, value];
                return { ...prev, [key]: next.length ? next : undefined };
            });
        }
    };

    const setBool = (key: 'in_stock' | 'has_discount', value: boolean) => {
        if (!isMobile) applyImmediate({ ...activeFilters, [key]: value || undefined });
        else setPending((p) => ({ ...p, [key]: value || undefined }));
    };

    const setPrice = (range: [number, number], priceFacets: { price_min: number; price_max: number }) => {
        const val = {
            price_min: range[0] !== priceFacets.price_min ? range[0] : undefined,
            price_max: range[1] !== priceFacets.price_max ? range[1] : undefined,
        };
        if (!isMobile) applyImmediate({ ...activeFilters, ...val });
        else setPending((p) => ({ ...p, ...val }));
    };

    const applyImmediate = (filters: ActiveFilters) => {
        const params = buildParams(filters);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.get('/search', params as any, { preserveScroll: true, only: ['results', 'pagination', 'facets', 'filters'] });
    };

    const applyPending = () => applyImmediate(pending);

    return { pending, toggle, setBool, setPrice, applyPending };
}

function buildParams(f: ActiveFilters): Record<string, unknown> {
    const p: Record<string, unknown> = {};
    if (f.q) p.q = f.q;
    if (f.sort && f.sort !== 'relevance') p.sort = f.sort;
    if (f.categories?.length) p.categories = f.categories;
    if (f.brand_ids?.length) p.brand_ids = f.brand_ids;
    if (f.colors?.length) p.colors = f.colors;
    if (f.sizes?.length) p.sizes = f.sizes;
    if (f.materials?.length) p.materials = f.materials;
    if (f.in_stock) p.in_stock = 1;
    if (f.has_discount) p.has_discount = 1;
    if (f.price_min) p.price_min = f.price_min;
    if (f.price_max) p.price_max = f.price_max;
    if (f.rating_min) p.rating_min = f.rating_min;
    return p;
}

function FilterBody({ facets, activeFilters, isMobile, onApply }: {
    facets: Facets;
    activeFilters: ActiveFilters;
    isMobile: boolean;
    onApply?: () => void;
}) {
    const { pending, toggle, setBool, setPrice, applyPending } = useFilterState(activeFilters, isMobile);
    const ef = isMobile ? pending : activeFilters;

    const hasChange = isMobile && JSON.stringify(pending) !== JSON.stringify(activeFilters);

    return (
        <div className="flex flex-col gap-0">
            {/* Price */}
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

            {/* Categories */}
            {facets.categories.length > 0 && (
                <Section title="Category">
                    {facets.categories.map((c) => (
                        <CheckboxItem
                            key={c.id}
                            label={c.name}
                            count={c.count}
                            checked={(ef.categories ?? []).includes(c.id)}
                            onChange={() => toggle('categories', c.id)}
                        />
                    ))}
                </Section>
            )}

            {/* Brands */}
            {facets.brands.length > 0 && (
                <Section title="Brand">
                    {facets.brands.map((b) => (
                        <CheckboxItem
                            key={b.id}
                            label={b.name}
                            count={b.count}
                            checked={(ef.brand_ids ?? []).includes(b.id)}
                            onChange={() => toggle('brand_ids', b.id)}
                        />
                    ))}
                </Section>
            )}

            {/* Colors */}
            {Object.keys(facets.colors).length > 0 && (
                <Section title="Color">
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
                                            ? 'border-brand-500 ring-2 ring-brand-500 ring-offset-1'
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

            {/* Sizes */}
            {Object.keys(facets.sizes).length > 0 && (
                <Section title="Size">
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
                                            ? 'border-brand-500 bg-brand-50 text-brand-700'
                                            : 'border-ink-200 text-ink-600 hover:border-ink-400',
                                    )}
                                >
                                    {size.toUpperCase()} <span className="font-normal text-ink-400">({count})</span>
                                </button>
                            );
                        })}
                    </div>
                </Section>
            )}

            {/* Availability + discount */}
            <Section title="Availability & Offers">
                <div className="space-y-0.5">
                    {facets.in_stock > 0 && (
                        <CheckboxItem
                            label="In Stock"
                            count={facets.in_stock}
                            checked={ef.in_stock ?? false}
                            onChange={() => setBool('in_stock', !(ef.in_stock ?? false))}
                        />
                    )}
                    {facets.has_discount > 0 && (
                        <CheckboxItem
                            label="On Sale"
                            count={facets.has_discount}
                            checked={ef.has_discount ?? false}
                            onChange={() => setBool('has_discount', !(ef.has_discount ?? false))}
                        />
                    )}
                </div>
            </Section>

            {/* Rating */}
            <Section title="Rating" defaultOpen={false}>
                <div className="space-y-0.5">
                    {[4, 3, 2].map((min) => (
                        <label key={min} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1.5 hover:bg-ink-50">
                            <input
                                type="radio"
                                name="rating_min"
                                checked={ef.rating_min === min}
                                onChange={() => {
                                    const filters = { ...activeFilters, rating_min: ef.rating_min === min ? undefined : min };
                                    if (!isMobile) {
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        router.get('/search', buildParams(filters) as any, { preserveScroll: true, only: ['results', 'pagination', 'facets', 'filters'] });
                                    }
                                }}
                                className="h-3.5 w-3.5 border-ink-300 text-brand-500 focus:ring-brand-500"
                            />
                            <div className="flex items-center gap-0.5">
                                {[1,2,3,4,5].map((s) => (
                                    <svg key={s} className={cn('h-3.5 w-3.5', s <= min ? 'text-brand-500' : 'text-ink-200')} fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                ))}
                                <span className="ml-1 text-xs text-ink-500">& up</span>
                            </div>
                        </label>
                    ))}
                </div>
            </Section>

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

export default function Filters({ facets, activeFilters, mobileOpen, onMobileClose }: Props) {
    return (
        <>
            {/* Desktop sidebar */}
            <aside className="hidden w-56 shrink-0 lg:block">
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
