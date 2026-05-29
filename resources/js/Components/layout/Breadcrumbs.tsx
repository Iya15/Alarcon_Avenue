import { cn } from '@/lib/cn';
import { Link } from '@inertiajs/react';

export interface BreadcrumbItem {
    label: string;
    href?: string;
}

export interface BreadcrumbsProps {
    items: BreadcrumbItem[];
    className?: string;
}

export default function Breadcrumbs({ items, className }: BreadcrumbsProps) {
    return (
        <nav aria-label="Breadcrumb" className={cn('flex items-center gap-1.5', className)}>
            {items.map((item, index) => {
                const isLast = index === items.length - 1;

                return (
                    <span key={index} className="flex items-center gap-1.5">
                        {index > 0 && (
                            <svg
                                className="h-3.5 w-3.5 text-ink-300"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                                aria-hidden="true"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        )}
                        {isLast || !item.href ? (
                            <span
                                className={cn(
                                    'text-sm',
                                    isLast ? 'font-medium text-ink-900' : 'text-ink-500',
                                )}
                                aria-current={isLast ? 'page' : undefined}
                            >
                                {item.label}
                            </span>
                        ) : (
                            <Link
                                href={item.href}
                                className="text-sm text-ink-500 transition-colors hover:text-ink-900"
                            >
                                {item.label}
                            </Link>
                        )}
                    </span>
                );
            })}
        </nav>
    );
}
