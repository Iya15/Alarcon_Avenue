import { Link } from '@inertiajs/react';

interface ActiveFilter {
    key: string;
    label: string;
    removeUrl: string;
}

interface Props {
    filters: ActiveFilter[];
    clearAllUrl: string;
}

export default function ActiveFilters({ filters, clearAllUrl }: Props) {
    if (filters.length === 0) return null;

    return (
        <div className="flex flex-wrap items-center gap-1.5">
            {filters.map((f) => (
                <Link
                    key={`${f.key}-${f.label}`}
                    href={f.removeUrl}
                    preserveScroll
                    className="flex items-center gap-1.5 rounded-full border border-ink-200 bg-surface px-2.5 py-1 text-xs text-ink-700 transition-colors hover:border-danger-300 hover:bg-danger-50 hover:text-danger-700"
                >
                    {f.label}
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </Link>
            ))}

            {filters.length > 1 && (
                <Link
                    href={clearAllUrl}
                    preserveScroll
                    className="text-xs font-medium text-ink-500 underline hover:text-ink-900"
                >
                    Clear all
                </Link>
            )}
        </div>
    );
}
