import { cn } from '@/lib/cn';
import { type ReactNode } from 'react';

export type BadgeVariant =
    | 'default'
    | 'brand'
    | 'inverted'
    | 'subtle'
    | 'outline'
    | 'success'
    | 'danger'
    | 'warning';

export interface BadgeProps {
    variant?: BadgeVariant;
    size?: 'sm' | 'md';
    dot?: boolean;
    icon?: ReactNode;
    children: ReactNode;
    className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
    default:  'bg-ink-100  text-ink-700  border border-ink-200',
    brand:    'bg-brand-100 text-brand-700 border border-brand-200',
    inverted: 'bg-ink-950  text-white     border border-ink-950',
    subtle:   'bg-ink-50   text-ink-600   border border-ink-100',
    outline:  'bg-transparent text-ink-700 border border-ink-300',
    success:  'bg-success-100 text-success-700 border border-success-100',
    danger:   'bg-danger-100  text-danger-700  border border-danger-100',
    warning:  'bg-brand-100   text-brand-700   border border-brand-200',
};

const dotColors: Record<BadgeVariant, string> = {
    default:  'bg-ink-400',
    brand:    'bg-brand-500',
    inverted: 'bg-white',
    subtle:   'bg-ink-400',
    outline:  'bg-ink-500',
    success:  'bg-success-500',
    danger:   'bg-danger-500',
    warning:  'bg-brand-500',
};

export default function Badge({
    variant = 'default',
    size = 'md',
    dot,
    icon,
    children,
    className,
}: BadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center font-medium',
                size === 'sm' ? 'gap-1   rounded px-1.5 py-0.5 text-xs' : 'gap-1.5 rounded-md px-2 py-0.5 text-xs',
                variantClasses[variant],
                className,
            )}
        >
            {dot && (
                <span
                    className={cn('h-1.5 w-1.5 rounded-full', dotColors[variant])}
                    aria-hidden="true"
                />
            )}
            {icon && <span className="h-3 w-3">{icon}</span>}
            {children}
        </span>
    );
}
