import { backdrop, drawerLeft } from '@/lib/motion';
import type { PageProps } from '@/types';
import { Dialog, DialogPanel } from '@headlessui/react';
import { Link, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

interface NavCategory {
    label: string;
    href: string;
    children?: Array<{ label: string; href: string }>;
}

const categories: NavCategory[] = [
    {
        label: 'Clothing',
        href: '/categories/clothing',
        children: [
            { label: "Men's",      href: '/categories/clothing-mens' },
            { label: "Women's",    href: '/categories/clothing-womens' },
            { label: "Kids'",      href: '/categories/clothing-kids' },
            { label: 'Activewear', href: '/categories/activewear' },
        ],
    },
    {
        label: 'Footwear',
        href: '/categories/footwear',
        children: [
            { label: 'Sneakers',  href: '/categories/footwear-sneakers' },
            { label: 'Sandals',   href: '/categories/footwear-sandals' },
            { label: 'Boots',     href: '/categories/footwear-boots' },
        ],
    },
    {
        label: 'Accessories', href: '/categories/accessories',
        children: [
            { label: 'Bags',     href: '/categories/accessories-bags' },
            { label: 'Watches',  href: '/categories/accessories-watches' },
            { label: 'Jewelry',  href: '/categories/accessories-jewelry' },
        ],
    },
    { label: 'Electronics', href: '/categories/electronics' },
    { label: 'Home & Living', href: '/categories/home-living' },
];

interface MobileNavProps {
    open: boolean;
    onClose: () => void;
}

function CategoryItem({ cat }: { cat: NavCategory }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div>
            <div className="flex items-center justify-between">
                <Link
                    href={cat.href}
                    className="flex-1 py-3 text-sm font-medium text-ink-900"
                >
                    {cat.label}
                </Link>
                {cat.children && (
                    <button
                        onClick={() => setExpanded((v) => !v)}
                        className="p-2 text-ink-400"
                        aria-expanded={expanded}
                    >
                        <motion.span
                            animate={{ rotate: expanded ? 90 : 0 }}
                            transition={{ duration: 0.15 }}
                            className="block"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        </motion.span>
                    </button>
                )}
            </div>

            <AnimatePresence>
                {expanded && cat.children && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1, transition: { duration: 0.2 } }}
                        exit={{ height: 0, opacity: 0, transition: { duration: 0.15 } }}
                        className="overflow-hidden"
                    >
                        <div className="ml-4 border-l border-ink-200 pl-4 pb-2">
                            {cat.children.map((child) => (
                                <Link
                                    key={child.href}
                                    href={child.href}
                                    className="block py-2 text-sm text-ink-500 transition-colors hover:text-ink-900"
                                >
                                    {child.label}
                                </Link>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function MobileNav({ open, onClose }: MobileNavProps) {
    const { auth } = usePage<PageProps>().props;

    return (
        <AnimatePresence>
            {open && (
                <Dialog open={open} onClose={onClose} className="relative z-50">
                    <motion.div
                        className="fixed inset-0 bg-black/40"
                        variants={backdrop}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        aria-hidden="true"
                    />

                    <motion.div
                        className="fixed left-0 top-0 bottom-0 w-72 max-w-[85vw]"
                        variants={drawerLeft}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <DialogPanel className="flex h-full flex-col bg-surface shadow-xl">
                            <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
                                <Link href="/" onClick={onClose} className="text-lg font-bold tracking-tight text-ink-950">
                                    Alarcon<span className="text-brand-500">.</span>
                                </Link>
                                <button
                                    onClick={onClose}
                                    className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700 focus:outline-none"
                                    aria-label="Close menu"
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto">
                                <div className="px-5 py-2">
                                    <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-ink-400">
                                        Shop
                                    </p>
                                    <div className="divide-y divide-ink-100">
                                        {categories.map((cat) => (
                                            <CategoryItem key={cat.href} cat={cat} />
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-2 border-t border-ink-100 px-5 py-4">
                                    <Link href="/products?sort=newest" className="block py-3 text-sm font-medium text-ink-900">
                                        New Arrivals
                                    </Link>
                                    <Link href="/products?tag=sale" className="block py-3 text-sm font-medium text-brand-600">
                                        Sale
                                    </Link>
                                </div>
                            </div>

                            <div className="border-t border-ink-100 px-5 py-4">
                                {auth.user ? (
                                    <div className="space-y-1">
                                        <p className="text-xs text-ink-500">{auth.user.name}</p>
                                        <Link href="/profile" className="block text-sm font-medium text-ink-900 hover:text-brand-500">
                                            My Account
                                        </Link>
                                        <Link href="/account/orders" className="block text-sm text-ink-600 hover:text-ink-900">
                                            Orders
                                        </Link>
                                        <Link
                                            href="/logout"
                                            method="post"
                                            as="button"
                                            className="text-sm text-ink-500 hover:text-ink-900"
                                        >
                                            Log out
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="flex gap-3">
                                        <Link href="/login" className="flex-1 rounded-lg border border-ink-200 py-2.5 text-center text-sm font-medium text-ink-700 hover:bg-ink-50">
                                            Log in
                                        </Link>
                                        <Link href="/register" className="flex-1 rounded-lg bg-brand-500 py-2.5 text-center text-sm font-medium text-white hover:bg-brand-600">
                                            Register
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </DialogPanel>
                    </motion.div>
                </Dialog>
            )}
        </AnimatePresence>
    );
}
