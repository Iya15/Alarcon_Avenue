import { cn } from '@/lib/cn';
import { forwardRef, type SelectHTMLAttributes } from 'react';

export interface SelectOption {
    value: string | number;
    label: string;
    disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
    label?: string;
    error?: string;
    hint?: string;
    options: SelectOption[];
    placeholder?: string;
    size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
    sm: 'h-8  text-xs  pl-2.5 pr-8',
    md: 'h-10 text-sm  pl-3   pr-9',
    lg: 'h-12 text-base pl-4  pr-10',
};

const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ label, error, hint, options, placeholder, size = 'md', className, id, ...props }, ref) => {
        const selectId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

        return (
            <div className="flex flex-col gap-1.5">
                {label && (
                    <label htmlFor={selectId} className="text-sm font-medium text-ink-800">
                        {label}
                    </label>
                )}

                <div className="relative">
                    <select
                        ref={ref}
                        id={selectId}
                        className={cn(
                            'w-full appearance-none rounded-lg border bg-surface text-ink-900',
                            'transition-colors duration-150',
                            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-0 focus:border-brand-500',
                            'disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-400',
                            sizeClasses[size],
                            error
                                ? 'border-danger-600 focus:ring-danger-500'
                                : 'border-ink-200',
                            className,
                        )}
                        {...props}
                    >
                        {placeholder && (
                            <option value="" disabled>
                                {placeholder}
                            </option>
                        )}
                        {options.map((opt) => (
                            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                                {opt.label}
                            </option>
                        ))}
                    </select>

                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-ink-400">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    </span>
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

Select.displayName = 'Select';
export default Select;
