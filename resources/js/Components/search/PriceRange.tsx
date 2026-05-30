import { useCallback, useEffect, useRef, useState } from 'react';

interface Props {
    min: number;
    max: number;
    value: [number, number];
    onChange: (range: [number, number]) => void;
    step?: number;
}

function formatPHP(cents: number) {
    return `₱${(cents / 100).toLocaleString('en-PH', { minimumFractionDigits: 0 })}`;
}

export default function PriceRange({ min, max, value, onChange, step = 100 }: Props) {
    const [low, setLow]   = useState(value[0]);
    const [high, setHigh] = useState(value[1]);
    const committed       = useRef(false);

    useEffect(() => {
        setLow(value[0]);
        setHigh(value[1]);
    }, [value[0], value[1]]);

    const debounceCommit = useCallback(
        debounce((l: number, h: number) => onChange([l, h]), 400),
        [onChange],
    );

    const handleLow = (v: number) => {
        const clamped = Math.min(v, high - step);
        setLow(clamped);
        debounceCommit(clamped, high);
    };

    const handleHigh = (v: number) => {
        const clamped = Math.max(v, low + step);
        setHigh(clamped);
        debounceCommit(low, clamped);
    };

    const range  = max - min || 1;
    const lowPct  = ((low  - min) / range) * 100;
    const highPct = ((high - min) / range) * 100;

    return (
        <div className="select-none">
            <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-ink-900">{formatPHP(low)}</span>
                <span className="text-xs text-ink-400">—</span>
                <span className="text-sm font-medium text-ink-900">{formatPHP(high)}</span>
            </div>

            <div className="relative h-5 w-full">
                {/* Track */}
                <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-ink-200" />
                {/* Filled range */}
                <div
                    className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-brand-500"
                    style={{ left: `${lowPct}%`, right: `${100 - highPct}%` }}
                />

                {/* Low thumb */}
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={low}
                    onChange={(e) => handleLow(Number(e.target.value))}
                    className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-10 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-brand-500 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-sm"
                    style={{ zIndex: low > max - (max - min) / 10 ? 5 : 3 }}
                />

                {/* High thumb */}
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={high}
                    onChange={(e) => handleHigh(Number(e.target.value))}
                    className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-10 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-brand-500 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-sm"
                    style={{ zIndex: 4 }}
                />
            </div>

            <div className="mt-1 flex items-center justify-between">
                <span className="text-[10px] text-ink-400">{formatPHP(min)}</span>
                <span className="text-[10px] text-ink-400">{formatPHP(max)}</span>
            </div>
        </div>
    );
}

function debounce<T extends (...args: Parameters<T>) => void>(fn: T, delay: number) {
    let timer: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}
