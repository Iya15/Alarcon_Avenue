import { cn } from '@/lib/cn';
import {
    forwardRef,
    type InputHTMLAttributes,
    type ReactNode,
} from 'react';
import Spinner from './Spinner';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
    label?: string;
    error?: string;
    hint?: string;
    icon?: ReactNode;
    iconRight?: ReactNode;
    prefix?: string;
    suffix?: string;
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
}

const sizeClasses = {
    sm: { input: 'h-8  text-xs  px-2.5', icon: 'w-4 h-4', iconPad: 'pl-8',  iconRPad: 'pr-8' },
    md: { input: 'h-10 text-sm  px-3',   icon: 'w-4 h-4', iconPad: 'pl-10', iconRPad: 'pr-10' },
    lg: { input: 'h-12 text-base px-4',  icon: 'w-5 h-5', iconPad: 'pl-12', iconRPad: 'pr-12' },
};

const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            label,
            error,
            hint,
            icon,
            iconRight,
            prefix,
            suffix,
            size = 'md',
            loading,
            className,
            id,
            ...props
        },
        ref,
    ) => {
        const sz = sizeClasses[size];
        const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
        const hasLeft  = !!icon  || !!prefix;
        const hasRight = !!iconRight || !!suffix || loading;

        return (
            <div className="flex flex-col gap-1.5">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="text-sm font-medium text-ink-800"
                    >
                        {label}
                    </label>
                )}

                <div className="relative flex items-center">
                    {prefix && (
                        <span className="flex h-full items-center rounded-l-lg border border-r-0 border-ink-200 bg-ink-50 px-3 text-sm text-ink-500">
                            {prefix}
                        </span>
                    )}

                    {icon && !prefix && (
                        <span className="pointer-events-none absolute left-3 text-ink-400">
                            <span className={sz.icon}>{icon}</span>
                        </span>
                    )}

                    <input
                        ref={ref}
                        id={inputId}
                        className={cn(
                            'w-full rounded-lg border bg-surface text-ink-900 placeholder:text-ink-400',
                            'transition-colors duration-150',
                            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-0 focus:border-brand-500',
                            'disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-400',
                            sz.input,
                            icon && !prefix ? sz.iconPad : '',
                            (iconRight || loading || suffix) && !suffix ? sz.iconRPad : '',
                            prefix ? 'rounded-l-none' : '',
                            suffix ? 'rounded-r-none' : '',
                            error
                                ? 'border-danger-600 focus:ring-danger-500 focus:border-danger-600'
                                : 'border-ink-200',
                            className,
                        )}
                        {...props}
                    />

                    {(loading || iconRight) && !suffix && (
                        <span className="pointer-events-none absolute right-3 text-ink-400">
                            {loading ? (
                                <Spinner size="sm" />
                            ) : (
                                <span className={sz.icon}>{iconRight}</span>
                            )}
                        </span>
                    )}

                    {suffix && (
                        <span className="flex h-full items-center rounded-r-lg border border-l-0 border-ink-200 bg-ink-50 px-3 text-sm text-ink-500">
                            {suffix}
                        </span>
                    )}
                </div>

                {(error || hint) && (
                    <p className={cn('text-xs', error ? 'text-danger-600' : 'text-ink-500')}>
                        {error ?? hint}
                    </p>
                )}
            </div>
        );
    },
);

Input.displayName = 'Input';
export default Input;
