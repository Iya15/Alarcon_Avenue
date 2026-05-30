import { Toaster } from '@/Components/ui/Toast';
import type { PageProps } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { type ReactNode, useState } from 'react';

interface NavItem {
    label: string;
    href: string;
    icon: ReactNode;
    adminOnly?: boolean;
    badge?: number;
}

function NavIcon({ d }: { d: string }) {
    return (
        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d={d} />
        </svg>
    );
}

const NAV: NavItem[] = [
    { label: 'Dashboard',   href: 'admin.dashboard',        icon: <NavIcon d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /> },
    { label: 'Orders',      href: 'admin.orders.index',     icon: <NavIcon d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /> },
    { label: 'Inventory',   href: 'admin.inventory.index',  icon: <NavIcon d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /> },
    { label: 'Products',    href: 'admin.products.index',   icon: <NavIcon d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /> },
    { label: 'Categories',  href: 'admin.categories.index', icon: <NavIcon d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /> },
    { label: 'Reviews',     href: 'admin.reviews.index',    icon: <NavIcon d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /> },
    { label: 'Coupons',     href: 'admin.coupons.index',    icon: <NavIcon d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /> },
    { label: 'Attributes',  href: 'admin.attributes.index', icon: <NavIcon d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /> },
    { label: 'Audit Logs',  href: 'admin.audit-logs.index', icon: <NavIcon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> },
    { label: 'Users',       href: 'admin.users.index',      icon: <NavIcon d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />, adminOnly: true },
    { label: 'Roles',       href: 'admin.roles.index',      icon: <NavIcon d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />, adminOnly: true },
];

function NavLink({ item, currentUrl }: { item: NavItem; currentUrl: string }) {
    const href = route(item.href);
    const isActive = currentUrl.startsWith(href) && href !== route('admin.dashboard')
        ? true
        : currentUrl === href;

    return (
        <Link
            href={href}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                    ? 'bg-[#e7901d] text-white'
                    : 'text-ink-400 hover:bg-ink-800 hover:text-white'
            }`}
        >
            {item.icon}
            {item.label}
        </Link>
    );
}

export default function AdminLayout({ children, title }: { children: ReactNode; title?: string }) {
    const { auth, flash } = usePage<PageProps>().props;
    const isAdmin = auth.roles?.includes('admin');
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const currentUrl = window.location.href;

    const visibleNav = NAV.filter((item) => !item.adminOnly || isAdmin);

    const sidebar = (
        <nav className="flex flex-col gap-1 p-3">
            {visibleNav.map((item) => (
                <NavLink key={item.href} item={item} currentUrl={currentUrl} />
            ))}
        </nav>
    );

    return (
        <div className="flex min-h-screen bg-ink-950 text-white">
            {/* Desktop sidebar */}
            <aside className="hidden w-56 shrink-0 flex-col border-r border-ink-800 lg:flex">
                <div className="flex h-14 items-center px-5 border-b border-ink-800">
                    <Link href="/" className="text-sm font-bold tracking-widest text-[#e7901d] uppercase">
                        Alarcon Admin
                    </Link>
                </div>
                <div className="flex-1 overflow-y-auto">{sidebar}</div>
                <div className="border-t border-ink-800 p-3 text-xs text-ink-500">
                    <p className="truncate">{auth.user?.name}</p>
                    <p className="truncate text-ink-600">{auth.user?.email}</p>
                </div>
            </aside>

            {/* Mobile sidebar overlay */}
            {mobileSidebarOpen && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <div className="absolute inset-0 bg-black/70" onClick={() => setMobileSidebarOpen(false)} />
                    <aside className="absolute left-0 top-0 bottom-0 w-56 bg-ink-950 border-r border-ink-800 flex flex-col z-50">
                        <div className="flex h-14 items-center justify-between px-5 border-b border-ink-800">
                            <span className="text-sm font-bold tracking-widest text-[#e7901d] uppercase">Admin</span>
                            <button onClick={() => setMobileSidebarOpen(false)} className="text-ink-400 hover:text-white">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto">{sidebar}</div>
                    </aside>
                </div>
            )}

            {/* Main content */}
            <div className="flex flex-1 flex-col min-w-0">
                {/* Top bar */}
                <header className="flex h-14 items-center gap-3 border-b border-ink-800 bg-ink-900 px-4 lg:px-6">
                    <button
                        className="lg:hidden text-ink-400 hover:text-white"
                        onClick={() => setMobileSidebarOpen(true)}
                        aria-label="Open menu"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <h1 className="flex-1 text-sm font-semibold text-white truncate">{title ?? 'Admin'}</h1>
                    <Link href="/" className="text-xs text-ink-400 hover:text-white">← Storefront</Link>
                </header>

                {/* Flash messages */}
                {flash?.success && (
                    <div className="mx-4 mt-4 rounded-lg bg-green-900/40 border border-green-700/50 px-4 py-2.5 text-sm text-green-300">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="mx-4 mt-4 rounded-lg bg-red-900/40 border border-red-700/50 px-4 py-2.5 text-sm text-red-300">
                        {flash.error}
                    </div>
                )}

                <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
            </div>

            <Toaster />
        </div>
    );
}
