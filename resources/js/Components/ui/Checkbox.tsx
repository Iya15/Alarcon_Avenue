import { cn } from '@/lib/cn';
import { forwardRef, useEffect, useRef, type InputHTMLAttributes } from 'react';

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    description?: string;
    error?: string;
    indeterminate?: boolean;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
    ({ label, description, error, indeterminate = false, className, id, ...props }, ref) => {
        const innerRef = useRef<HTMLInputElement>(null);
        const checkboxId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

        useEffect(() => {
            const el = (ref as React.RefObject<HTMLInputElement>)?.current ?? innerRef.current;
            if (el) el.indeterminate = indeterminate;
        }, [indeterminate, ref]);

        return (
            <div className="flex gap-3">
                <div className="flex h-5 items-center">
                    <input
                        ref={ref ?? innerRef}
                        id={checkboxId}
                        type="checkbox"
                        className={cn(
                            'h-4 w-4 rounded border-ink-300 text-brand-500',
                            'focus:ring-2 focus:ring-brand-500 focus:ring-offset-1',
                            'disabled:cursor-not-allowed disabled:opacity-50',
                            'transition-colors duration-150',
                            error && 'border-danger-600 focus:ring-danger-500',
                            className,
                        )}
                        {...props}
                    />
                </div>

                {(label || description || error) && (
                    <div className="flex flex-col gap-0.5">
                        {label && (
                            <label
                                htmlFor={checkboxId}
                                className="cursor-pointer text-sm font-medium text-ink-900"
                            >
                                {label}
                            </label>
                        )}
                        {description && (
                            <p className="text-xs text-ink-500">{description}</p>
                        )}
                        {error && (
                            <p className="text-xs text-danger-600">{error}</p>
                        )}
                    </div>
                )}
            </div>
        );
    },
);

Checkbox.displayName = 'Checkbox';
export default Checkbox;
