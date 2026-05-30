import AdminLayout from '@/Components/layout/AdminLayout';
import { ThemedAreaChart, ThemedBarChart } from '@/Components/admin/Chart';
import type { PageProps } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

interface Summary {
    total_orders: number;
    gross_cents: number;
    net_cents: number;
    refunds_cents: number;
    items_sold: number;
    aov_cents: number;
    conversion_pct: number;
    new_customers: number;
}

interface ChartPoint { date: string; [key: string]: unknown }

interface TopProduct {
    product_id: number;
    product_name: string;
    total_units: number;
    total_revenue: number;
}

interface Props extends PageProps {
    range: { from: string; to: string; preset: string };
    summary: Summary;
    revenue_chart: ChartPoint[];
    orders_chart: ChartPoint[];
    traffic_chart: ChartPoint[];
    top_products: TopProduct[];
}

function formatPHP(cents: number) {
    return `₱${(cents / 100).toLocaleString('en-PH', { minimumFractionDigits: 0 })}`;
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
    return (
        <div className="rounded-xl bg-ink-900 border border-ink-800 p-5">
            <p className="text-xs font-medium text-ink-400 uppercase tracking-wider">{label}</p>
            <p className="mt-1.5 text-2xl font-bold text-white">{value}</p>
            {sub && <p className="mt-1 text-xs text-ink-500">{sub}</p>}
        </div>
    );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-xl bg-ink-900 border border-ink-800 p-5">
            <h3 className="mb-4 text-sm font-semibold text-white">{title}</h3>
            {children}
        </div>
    );
}

const PRESETS = [
    { label: '7d',    value: '7' },
    { label: '30d',   value: '30' },
    { label: '90d',   value: '90' },
];

export default function Dashboard({ range, summary, revenue_chart, orders_chart, traffic_chart, top_products }: Props) {
    const [preset, setPreset] = useState(range.preset);

    function applyPreset(p: string) {
        setPreset(p);
        router.get(route('admin.dashboard'), { preset: p }, { preserveState: true });
    }

    // Format chart date labels to short form
    const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
    const revData  = revenue_chart.map((r) => ({ ...r, date: fmtDate(r.date as string), gross: Math.round((r.gross_cents as number) / 100), net: Math.round((r.net_cents as number) / 100) }));
    const ordData  = orders_chart.map((r) => ({ ...r, date: fmtDate(r.date as string) }));
    const trafData = traffic_chart.map((r) => ({ ...r, date: fmtDate(r.date as string) }));

    return (
        <AdminLayout title="Dashboard">
            <Head title="Dashboard — Admin" />

            {/* Preset picker */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-white">Analytics</h2>
                <div className="flex gap-1.5">
                    {PRESETS.map((p) => (
                        <button
                            key={p.value}
                            onClick={() => applyPreset(p.value)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                preset === p.value
                                    ? 'bg-[#e7901d] text-white'
                                    : 'bg-ink-800 text-ink-300 hover:bg-ink-700'
                            }`}
                        >
                            {p.label}
                        </button>
                    ))}
                    <span className="ml-2 self-center text-xs text-ink-500">{range.from} → {range.to}</span>
                </div>
            </div>

            {/* KPI grid */}
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label="Gross Revenue"  value={formatPHP(summary.gross_cents)}  sub={`Net ${formatPHP(summary.net_cents)}`} />
                <StatCard label="Orders"         value={summary.total_orders.toLocaleString()} sub={`${summary.items_sold} items sold`} />
                <StatCard label="AOV"            value={formatPHP(summary.aov_cents)} />
                <StatCard label="Conversion"     value={`${summary.conversion_pct}%`} sub="orders / sessions" />
                <StatCard label="Refunds"        value={formatPHP(summary.refunds_cents)} />
                <StatCard label="New Customers"  value={summary.new_customers.toLocaleString()} />
            </div>

            {/* Charts row */}
            <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <ChartCard title="Revenue (₱)">
                    <ThemedAreaChart
                        data={revData}
                        areas={[
                            { key: 'gross', label: 'Gross' },
                            { key: 'net',   label: 'Net',  color: '#6b7280' },
                        ]}
                    />
                </ChartCard>
                <ChartCard title="Orders">
                    <ThemedBarChart
                        data={ordData}
                        bars={[{ key: 'orders_count', label: 'Orders' }]}
                    />
                </ChartCard>
                <ChartCard title="Sessions vs Product Views">
                    <ThemedAreaChart
                        data={trafData}
                        areas={[
                            { key: 'sessions',      label: 'Sessions',      color: '#e7901d' },
                            { key: 'product_views', label: 'Product Views', color: '#6b7280' },
                        ]}
                    />
                </ChartCard>

                {/* Top products */}
                <div className="rounded-xl bg-ink-900 border border-ink-800 p-5">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-white">Top Products</h3>
                        <a
                            href={route('admin.analytics.export.products', { preset })}
                            className="text-xs text-[#e7901d] hover:underline"
                        >
                            Export CSV
                        </a>
                    </div>
                    <div className="space-y-2">
                        {top_products.length === 0 && <p className="text-xs text-ink-500">No data yet.</p>}
                        {top_products.map((p, i) => (
                            <div key={p.product_id} className="flex items-center gap-3">
                                <span className="w-5 text-xs text-ink-500">{i + 1}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="truncate text-xs font-medium text-white">{p.product_name}</p>
                                    <p className="text-xs text-ink-500">{p.total_units} units</p>
                                </div>
                                <span className="text-xs font-semibold text-[#e7901d]">{formatPHP(p.total_revenue)}</span>
                            </div>
                        ))}
                    </div>
                    <a
                        href={route('admin.analytics.export.sales', { preset })}
                        className="mt-4 block text-xs text-ink-400 hover:text-white"
                    >
                        Export sales CSV →
                    </a>
                </div>
            </div>
        </AdminLayout>
    );
}
