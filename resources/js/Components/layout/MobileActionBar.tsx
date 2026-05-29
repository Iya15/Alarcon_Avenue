import { cn } from '@/lib/cn';
import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

interface TabItem {
    label: string;
    href: string;
    icon: (active: boolean) => React.ReactNode;
    routePattern: string;
}

const tabs: TabItem[] = [
    {
        label: 'Home',
        href: '/',
        routePattern: 'home',
        icon: (active) => (
            <svg className="h-5 w-5" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
        ),
    },
    {
        label: 'Browse',
        href: '/categories',
        routePattern: 'categories',
        icon: (active) => (
            <svg className="h-5 w-5" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
        ),
    },
    {
        label: 'Search',
        href: '/search',
        routePattern: 'search',
        icon: (active) => (
            <svg className="h-5 w-5" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
        ),
    },
    {
        label: 'Cart',
        href: '/cart',
        routePattern: 'cart',
        icon: (active) => (
            <svg className="h-5 w-5" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
        ),
    },
    {
        label: 'Account',
        href: '/profile',
        routePattern: 'profile',
        icon: (active) => (
            <svg className="h-5 w-5" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
        ),
    },
];

export default function MobileActionBar() {
    const { url } = usePage();
    const [keyboardOpen, setKeyboardOpen] = useState(false);

    useEffect(() => {
        const vv = window.visualViewport;
        if (!vv) return;
        const handler = () => setKeyboardOpen(vv.height < window.innerHeight * 0.75);
        vv.addEventListener('resize', handler);
        return () => vv.removeEventListener('resize', handler);
    }, []);

    if (keyboardOpen) return null;

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-40 border-t border-ink-200 bg-surface/95 backdrop-blur-md lg:hidden"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            aria-label="Mobile navigation"
        >
            <div className="flex items-stretch">
                {tabs.map((tab) => {
                    const active = url === tab.href || (tab.routePattern !== 'home' && url.startsWith(tab.href));
                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={cn(
                                'flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors',
                                active ? 'text-brand-500' : 'text-ink-400 hover:text-ink-700',
                            )}
                            aria-current={active ? 'page' : undefined}
                        >
                            {tab.icon(active)}
                            <span className="text-[10px] font-medium leading-none">{tab.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
