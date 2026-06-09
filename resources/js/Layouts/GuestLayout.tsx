import { Link } from '@inertiajs/react';
import { type ReactNode } from 'react';

interface Props {
    children: ReactNode;
    title: string;
    subtitle?: string;
}

export default function GuestLayout({ children, title, subtitle }: Props) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 py-12">
            <div className="w-full max-w-sm">
                {/* Card */}
                <div className="rounded-2xl border border-ink-200 bg-surface p-8 shadow-lg">
                    {/* Back button */}
                    <Link
                        href="/"
                        className="mb-6 flex items-center gap-1.5 text-sm text-ink-500 transition-colors hover:text-ink-900"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                        Back
                    </Link>

                    {/* Brand wordmark + headings — centred */}
                    <div className="text-center">
                        <Link href="/" className="inline-block text-xl font-bold tracking-tight text-ink-950">
                            Alarcon<span className="text-brand-500">.</span>
                        </Link>
                        <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink-950">{title}</h1>
                        {subtitle && (
                            <p className="mt-1.5 text-sm text-ink-500">{subtitle}</p>
                        )}
                    </div>

                    <div className="mt-6">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
