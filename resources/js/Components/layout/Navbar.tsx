import { cn } from '@/lib/cn';
import SearchInput from '@/Components/search/SearchInput';
import ThemeToggle from '@/Components/ui/ThemeToggle';
import { useCartStore } from '@/stores/cartStore';
import { type NavCategory, type PageProps } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import Container from './Container';
import MobileNav from './MobileNav';

function CartIcon() {
    const { open, totals } = useCartStore();
    const { cart_count: sharedCount } = usePage<PageProps>().props;

    // Prefer live Zustand count; fall back to server-shared count on initial load
    const count = totals.items_count > 0 ? totals.items_count : sharedCount;

    return (
        <button
            onClick={open}
            className="relative rounded-lg p-2 text-ink-700 transition-colors hover:bg-ink-100 hover:text-ink-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label={`Cart${count > 0 ? `, ${count} items` : ''}`}
        >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
            {count > 0 && (
                <motion.span
                    key={count}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white"
                >
                    {count > 9 ? '9+' : count}
                </motion.span>
            )}
        </button>
    );
}

export default function Navbar({ transparent = false }: { transparent?: boolean }) {
    const { auth, nav_categories } = usePage<PageProps>().props;
    const navCats: NavCategory[] = nav_categories ?? [];
    const [mobileOpen, setMobileOpen] = useState(false);
    const [megaOpen, setMegaOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const megaTimer = useRef<ReturnType<typeof setTimeout>>();

    useEffect(() => {
        if (!transparent) return;
        const handler = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handler, { passive: true });
        return () => window.removeEventListener('scroll', handler);
    }, [transparent]);

    const openMega  = () => { clearTimeout(megaTimer.current); setMegaOpen(true); };
    const closeMega = () => { megaTimer.current = setTimeout(() => setMegaOpen(false), 120); };

    const navBg = transparent && !scrolled
        ? 'bg-transparent'
        : 'bg-surface/95 backdrop-blur-md border-b border-ink-200 shadow-xs';

    return (
        <>
            <header className={cn('sticky top-0 z-40 transition-all duration-200', navBg)}>
                <Container>
                    <div className="flex h-16 items-center justify-between gap-4">
                        {/* Logo */}
                        <Link href="/" className="shrink-0 text-xl font-bold tracking-tight text-ink-950">
                            Alarcon<span className="text-brand-500">.</span>
                        </Link>

                        {/* Desktop nav */}
                        <nav className="hidden items-center gap-1 lg:flex">
                            {/* Shop mega-menu trigger */}
                            <div
                                onMouseEnter={openMega}
                                onMouseLeave={closeMega}
                                className="relative"
                            >
                                <button className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-100 hover:text-ink-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
                                    Shop
                                    <motion.span
                                        animate={{ rotate: megaOpen ? 180 : 0 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        <svg className="h-3.5 w-3.5 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </motion.span>
                                </button>

                                <AnimatePresence>
                                    {megaOpen && (
                                        <motion.div
                                            onMouseEnter={openMega}
                                            onMouseLeave={closeMega}
                                            className="absolute left-0 top-full pt-2"
                                            initial={{ opacity: 0, y: -6 }}
                                            animate={{ opacity: 1, y: 0, transition: { duration: 0.18, ease: [0.32, 0.72, 0, 1] } }}
                                            exit={{ opacity: 0, y: -6, transition: { duration: 0.12 } }}
                                        >
                                            <div className="rounded-2xl border border-ink-200 bg-surface p-6 shadow-lg"
                                                style={{ width: Math.max(320, navCats.length * 160) + 'px', maxWidth: '800px' }}>
                                                {navCats.length === 0 ? (
                                                    <p className="text-sm text-ink-400">No categories configured yet.</p>
                                                ) : (
                                                    <div
                                                        className="grid gap-6"
                                                        style={{ gridTemplateColumns: `repeat(${Math.min(navCats.length, 4)}, minmax(0, 1fr))` }}
                                                    >
                                                        {navCats.map((cat) => (
                                                            <div key={cat.id}>
                                                                <Link
                                                                    href={route('categories.show', cat.slug)}
                                                                    className="mb-2.5 block text-xs font-semibold uppercase tracking-widest text-ink-800 hover:text-brand"
                                                                >
                                                                    {cat.name}
                                                                </Link>
                                                                {cat.children.length > 0 && (
                                                                    <ul className="space-y-1.5">
                                                                        {cat.children.map((child) => (
                                                                            <li key={child.id}>
                                                                                <Link
                                                                                    href={route('categories.show', child.slug)}
                                                                                    className="text-sm text-ink-500 transition-colors hover:text-ink-950"
                                                                                >
                                                                                    {child.name}
                                                                                </Link>
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                <div className="mt-5 border-t border-ink-100 pt-4 flex gap-4">
                                                    <Link href={route('products.index') + '?sort=newest'} className="text-sm font-medium text-ink-900 hover:text-brand">
                                                        New Arrivals →
                                                    </Link>
                                                    <Link href={route('products.index')} className="text-sm font-medium text-brand hover:text-brand/80">
                                                        All Products →
                                                    </Link>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <Link href="/products?sort=newest" className="rounded-lg px-3 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-100 hover:text-ink-950">
                                New Arrivals
                            </Link>
                            <Link href="/products?tag=sale" className="rounded-lg px-3 py-2 text-sm font-medium text-brand-600 transition-colors hover:bg-brand-50 hover:text-brand-700">
                                Sale
                            </Link>
                        </nav>

                        {/* Right actions */}
                        <div className="flex items-center gap-1">
                            {/* Desktop only: inline search bar expands on click */}
                            <div className="hidden lg:flex">
                                <AnimatePresence mode="popLayout">
                                    {searchOpen ? (
                                        <motion.div
                                            key="search-bar"
                                            initial={{ width: 0, opacity: 0 }}
                                            animate={{ width: 280, opacity: 1, transition: { duration: 0.2 } }}
                                            exit={{ width: 0, opacity: 0, transition: { duration: 0.15 } }}
                                        >
                                            <SearchInput
                                                autoFocus
                                                placeholder="Search…"
                                                onClose={() => setSearchOpen(false)}
                                            />
                                        </motion.div>
                                    ) : (
                                        <motion.button
                                            key="search-icon"
                                            className="rounded-lg p-2 text-ink-700 transition-colors hover:bg-ink-100 hover:text-ink-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                                            aria-label="Search"
                                            onClick={() => setSearchOpen(true)}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                        >
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                            </svg>
                                        </motion.button>
                                    )}
                                </AnimatePresence>
                            </div>
                            {/* Mobile only: icon navigates directly to /search */}
                            <Link
                                href="/search"
                                className="rounded-lg p-2 text-ink-700 transition-colors hover:bg-ink-100 hover:text-ink-950 lg:hidden"
                                aria-label="Search"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                </svg>
                            </Link>

                            <ThemeToggle />

                            <CartIcon />

                            <div className="hidden lg:block">
                                {auth.user ? (
                                    <Link href="/account" className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-ink-900 text-xs font-bold text-white" title={auth.user.name}>
                                        {auth.user.avatar_url
                                            ? <img src={auth.user.avatar_url} alt={auth.user.name} className="h-full w-full object-cover" />
                                            : auth.user.name.charAt(0).toUpperCase()
                                        }
                                    </Link>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Link href="/login" className="text-sm font-medium text-ink-700 hover:text-ink-950">
                                            Log in
                                        </Link>
                                        <Link href="/register" className="rounded-lg bg-brand-500 px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-600">
                                            Register
                                        </Link>
                                    </div>
                                )}
                            </div>

                            {/* Mobile hamburger */}
                            <button
                                onClick={() => setMobileOpen(true)}
                                className="rounded-lg p-2 text-ink-700 transition-colors hover:bg-ink-100 lg:hidden"
                                aria-label="Open menu"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </Container>
            </header>

            <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
        </>
    );
}
