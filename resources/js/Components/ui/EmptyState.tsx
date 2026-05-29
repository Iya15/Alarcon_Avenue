import { cn } from '@/lib/cn';
import { type ReactNode } from 'react';

export interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
    secondaryAction?: ReactNode;
    size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
    sm: { wrap: 'py-8', icon: 'h-8 w-8', title: 'text-sm font-semibold', desc: 'text-xs mt-1' },
    md: { wrap: 'py-12', icon: 'h-10 w-10', title: 'text-base font-semibold', desc: 'text-sm mt-1.5' },
    lg: { wrap: 'py-16', icon: 'h-12 w-12', title: 'text-lg font-semibold', desc: 'text-sm mt-2' },
};

export default function EmptyState({
    icon,
    title,
    description,
    action,
    secondaryAction,
    size = 'md',
}: EmptyStateProps) {
    const s = sizeClasses[size];

    return (
        <div className={cn('flex flex-col items-center text-center', s.wrap)}>
            {icon && (
                <div className={cn('mb-4 flex items-center justify-center rounded-xl bg-ink-100 p-3 text-ink-400', s.icon)}>
                    {icon}
                </div>
            )}
            <p className={cn('text-ink-900', s.title)}>{title}</p>
            {description && (
                <p className={cn('max-w-sm text-ink-500', s.desc)}>{description}</p>
            )}
            {(action || secondaryAction) && (
                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                    {action}
                    {secondaryAction}
                </div>
            )}
        </div>
    );
}
