import { useSearchStore } from '@/stores/searchStore';
import { router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    type KeyboardEvent,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';

interface Props {
    initialQuery?: string;
    placeholder?: string;
    autoFocus?: boolean;
    onClose?: () => void;
    className?: string;
}

function debounce<T extends (...args: Parameters<T>) => void>(fn: T, delay: number) {
    let timer: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

export default function SearchInput({
    initialQuery = '',
    placeholder = 'Search products, brands…',
    autoFocus = false,
    onClose,
    className = '',
}: Props) {
    const [inputValue, setInputValue] = useState(initialQuery);
    const [open, setOpen] = useState(false);
    const [trending, setTrending] = useState<string[]>([]);

    const {
        suggestions,
        recentSearches,
        isLoadingSuggestions,
        setQuery,
        setSuggestions,
        setLoadingSuggestions,
        addRecentSearch,
        removeRecentSearch,
        clearRecentSearches,
    } = useSearchStore();

    const inputRef  = useRef<HTMLInputElement>(null);
    const wrapRef   = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (autoFocus) inputRef.current?.focus();
    }, [autoFocus]);

    useEffect(() => {
        fetch('/api/search/trending')
            .then((r) => r.json())
            .then((data: string[]) => setTrending(data))
            .catch(() => {});
    }, []);

    const fetchSuggestions = useCallback(
        debounce((q: string) => {
            if (q.length < 2) {
                setSuggestions([]);
                setLoadingSuggestions(false);
                return;
            }
            setLoadingSuggestions(true);
            fetch(`/api/search/suggestions?q=${encodeURIComponent(q)}`)
                .then((r) => r.json())
                .then((data) => { setSuggestions(data); setLoadingSuggestions(false); })
                .catch(() => setLoadingSuggestions(false));
        }, 280),
        [],
    );

    const handleChange = (value: string) => {
        setInputValue(value);
        setQuery(value);
        fetchSuggestions(value);
        setOpen(true);
    };

    const handleSubmit = (q: string) => {
        if (!q.trim()) return;
        addRecentSearch(q.trim());
        setOpen(false);
        onClose?.();
        router.get('/search', { q: q.trim() });
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSubmit(inputValue);
        if (e.key === 'Escape') { setOpen(false); onClose?.(); }
    };

    const showDropdown = open && (
        inputValue.length > 0
            ? suggestions.length > 0
            : recentSearches.length > 0 || trending.length > 0
    );

    return (
        <div ref={wrapRef} className={`relative ${className}`}>
            <div className="relative flex items-center">
                <svg className="pointer-events-none absolute left-3.5 h-4 w-4 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>

                <input
                    ref={inputRef}
                    type="search"
                    value={inputValue}
                    onChange={(e) => handleChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setOpen(true)}
                    placeholder={placeholder}
                    className="h-11 w-full rounded-xl border border-ink-200 bg-surface pl-10 pr-4 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    aria-label="Search"
                    aria-autocomplete="list"
                    aria-expanded={showDropdown}
                    autoComplete="off"
                />

                {inputValue && (
                    <button
                        onClick={() => { setInputValue(''); setSuggestions([]); inputRef.current?.focus(); }}
                        className="absolute right-3 rounded p-0.5 text-ink-400 hover:text-ink-700"
                        aria-label="Clear search"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            <AnimatePresence>
                {showDropdown && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                        <motion.div
                            className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-ink-200 bg-surface shadow-lg"
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0, transition: { duration: 0.15 } }}
                            exit={{ opacity: 0, y: -6, transition: { duration: 0.1 } }}
                        >
                            {inputValue.length > 0 ? (
                                <ul>
                                    {isLoadingSuggestions && (
                                        <li className="px-4 py-3 text-sm text-ink-400">Searching…</li>
                                    )}
                                    {suggestions.map((s) => (
                                        <li key={s.slug}>
                                            <button
                                                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-ink-800 hover:bg-ink-50"
                                                onClick={() => handleSubmit(s.label)}
                                            >
                                                <svg className="h-3.5 w-3.5 text-ink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                                </svg>
                                                {s.label}
                                            </button>
                                        </li>
                                    ))}
                                    <li>
                                        <button
                                            className="flex w-full items-center gap-3 border-t border-ink-100 px-4 py-2.5 text-left text-sm font-medium text-brand-600 hover:bg-ink-50"
                                            onClick={() => handleSubmit(inputValue)}
                                        >
                                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                            </svg>
                                            Search for "{inputValue}"
                                        </button>
                                    </li>
                                </ul>
                            ) : (
                                <div className="p-3">
                                    {recentSearches.length > 0 && (
                                        <div className="mb-3">
                                            <div className="mb-1.5 flex items-center justify-between px-1">
                                                <span className="text-xs font-semibold uppercase tracking-widest text-ink-400">Recent</span>
                                                <button onClick={clearRecentSearches} className="text-xs text-ink-400 hover:text-ink-700">Clear</button>
                                            </div>
                                            {recentSearches.map((q) => (
                                                <div key={q} className="group flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-ink-50">
                                                    <button className="flex flex-1 items-center gap-2 text-sm text-ink-700" onClick={() => handleSubmit(q)}>
                                                        <svg className="h-3.5 w-3.5 text-ink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        {q}
                                                    </button>
                                                    <button onClick={() => removeRecentSearch(q)} className="hidden text-ink-300 hover:text-ink-600 group-hover:block">
                                                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {trending.length > 0 && (
                                        <div>
                                            <p className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-widest text-ink-400">Trending</p>
                                            <div className="flex flex-wrap gap-1.5 px-1">
                                                {trending.slice(0, 8).map((t) => (
                                                    <button
                                                        key={t}
                                                        onClick={() => handleSubmit(t)}
                                                        className="rounded-full border border-ink-200 px-2.5 py-1 text-xs text-ink-600 hover:border-brand-400 hover:text-brand-600"
                                                    >
                                                        {t}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
