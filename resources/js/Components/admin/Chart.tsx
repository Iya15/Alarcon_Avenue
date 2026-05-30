/**
 * Thin wrapper that applies the black/white/yellow design tokens to Recharts.
 * Import chart primitives from here rather than directly from recharts so
 * colour tokens stay in one place.
 */
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

export const BRAND   = '#e7901d';
export const WHITE   = '#ffffff';
export const MUTED   = '#6b7280';  // ink-500 equivalent in dark context
export const GRID    = '#374151';  // ink-700
export const BG_DARK = '#111827';  // ink-900

// ── Shared axis/tooltip defaults ───────────────────────────────────────────────

const axisProps = {
    tick:         { fill: MUTED, fontSize: 11 },
    axisLine:     { stroke: GRID },
    tickLine:     false as const,
};

const tooltipStyle = {
    contentStyle: { backgroundColor: BG_DARK, border: `1px solid ${GRID}`, borderRadius: 8, fontSize: 12 },
    labelStyle:   { color: WHITE, fontWeight: 600 },
    itemStyle:    { color: MUTED },
    cursor:       { fill: 'rgba(255,255,255,0.05)' },
};

// ── Themed chart components ────────────────────────────────────────────────────

export function ThemedLineChart({
    data,
    lines,
    xKey = 'date',
    height = 240,
}: {
    data: Record<string, unknown>[];
    lines: { key: string; label: string; color?: string }[];
    xKey?: string;
    height?: number;
}) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey={xKey} {...axisProps} />
                <YAxis {...axisProps} width={50} />
                <Tooltip {...tooltipStyle} />
                {lines.length > 1 && <Legend wrapperStyle={{ fontSize: 11, color: MUTED }} />}
                {lines.map((l) => (
                    <Line
                        key={l.key}
                        type="monotone"
                        dataKey={l.key}
                        name={l.label}
                        stroke={l.color ?? BRAND}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: l.color ?? BRAND }}
                    />
                ))}
            </LineChart>
        </ResponsiveContainer>
    );
}

export function ThemedAreaChart({
    data,
    areas,
    xKey = 'date',
    height = 240,
}: {
    data: Record<string, unknown>[];
    areas: { key: string; label: string; color?: string }[];
    xKey?: string;
    height?: number;
}) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                    {areas.map((a) => (
                        <linearGradient key={a.key} id={`grad-${a.key}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={a.color ?? BRAND} stopOpacity={0.25} />
                            <stop offset="95%" stopColor={a.color ?? BRAND} stopOpacity={0} />
                        </linearGradient>
                    ))}
                </defs>
                <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey={xKey} {...axisProps} />
                <YAxis {...axisProps} width={50} />
                <Tooltip {...tooltipStyle} />
                {areas.length > 1 && <Legend wrapperStyle={{ fontSize: 11, color: MUTED }} />}
                {areas.map((a) => (
                    <Area
                        key={a.key}
                        type="monotone"
                        dataKey={a.key}
                        name={a.label}
                        stroke={a.color ?? BRAND}
                        strokeWidth={2}
                        fill={`url(#grad-${a.key})`}
                        dot={false}
                    />
                ))}
            </AreaChart>
        </ResponsiveContainer>
    );
}

export function ThemedBarChart({
    data,
    bars,
    xKey = 'date',
    height = 240,
}: {
    data: Record<string, unknown>[];
    bars: { key: string; label: string; color?: string }[];
    xKey?: string;
    height?: number;
}) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey={xKey} {...axisProps} />
                <YAxis {...axisProps} width={50} />
                <Tooltip {...tooltipStyle} />
                {bars.length > 1 && <Legend wrapperStyle={{ fontSize: 11, color: MUTED }} />}
                {bars.map((b) => (
                    <Bar key={b.key} dataKey={b.key} name={b.label} fill={b.color ?? BRAND} radius={[4, 4, 0, 0]} />
                ))}
            </BarChart>
        </ResponsiveContainer>
    );
}
