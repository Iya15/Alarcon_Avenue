import Container from '@/Components/layout/Container';
import PageLayout from '@/Components/layout/PageLayout';
import { cn } from '@/lib/cn';
import { Link, usePage } from '@inertiajs/react';
import { type ReactNode } from 'react';

const NAV = [
    { href: '/account',                   label: 'Profile',          icon: '👤' },
    { href: '/account/orders',            label: 'Orders',           icon: '📦' },
    { href: '/account/wishlist',          label: 'Wishlist',         icon: '❤️' },
    { href: '/account/addresses',         label: 'Addresses',        icon: '📍' },
    { href: '/account/notifications',     label: 'Notifications',    icon: '🔔' },
    { href: '/account/reviews',           label: 'Reviews',          icon: '⭐' },
    { href: '/account/recently-viewed',   label: 'Recently Viewed',  icon: '👁' },
];

function NavItem({ href, label, icon }: { href: string; label: string; icon: string }) {
    const { url } = usePage();
    const active = url === href || (href !== '/account' && url.startsWith(href));

    return (
        <Link
            href={href}
            className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                active
                    ? 'bg-ink-100 font-semibold text-ink-950'
                    : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900',
            )}
        >
            <span className="text-base leading-none">{icon}</span>
            {label}
        </Link>
    );
}

export default function AccountLayout({ children, title }: { children: ReactNode; title?: string }) {
    return (
        <PageLayout breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Account' }]}>
            <Container className="py-8">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
                    {/* ── Desktop sidebar ────────────────────────────────── */}
                    <aside className="hidden lg:block">
                        <div className="sticky top-24 rounded-2xl border border-ink-200 bg-surface p-3">
                            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400">
                                My Account
                            </p>
                            <nav className="space-y-0.5">
                                {NAV.map((n) => <NavItem key={n.href} {...n} />)}
                            </nav>
                        </div>
                    </aside>

                    {/* ── Mobile top tabs (scrollable) ───────────────────── */}
                    <div className="flex gap-1 overflow-x-auto pb-1 lg:hidden">
                        {NAV.map(({ href, label }) => {
                            const { url } = usePage();
                            const active = url === href || (href !== '/account' && url.startsWith(href));
                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    className={cn(
                                        'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap',
                                        active
                                            ? 'border-brand-500 bg-brand-50 text-brand-700'
                                            : 'border-ink-200 text-ink-600 hover:border-ink-300',
                                    )}
                                >
                                    {label}
                                </Link>
                            );
                        })}
                    </div>

                    {/* ── Main content ───────────────────────────────────── */}
                    <main className="lg:col-span-3">
                        {title && (
                            <h1 className="mb-6 text-xl font-bold tracking-tight text-ink-950 lg:text-2xl">
                                {title}
                            </h1>
                        )}
                        {children}
                    </main>
                </div>
            </Container>
        </PageLayout>
    );
}
