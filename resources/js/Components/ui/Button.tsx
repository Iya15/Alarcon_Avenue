import { cn } from '@/lib/cn';
import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import Spinner from './Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    icon?: ReactNode;
    iconRight?: ReactNode;
    fullWidth?: boolean;
    href?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
    primary:
        'bg-brand-500 text-white border border-brand-500 hover:bg-brand-600 hover:border-brand-600 active:bg-brand-700 focus-visible:ring-brand shadow-xs',
    secondary:
        'bg-surface text-ink-900 border border-ink-200 hover:bg-ink-50 hover:border-ink-300 active:bg-ink-100 focus-visible:ring-brand shadow-xs',
    ghost:
        'bg-transparent text-ink-700 border border-transparent hover:bg-ink-100 hover:text-ink-900 active:bg-ink-200 focus-visible:ring-brand',
    danger:
        'bg-ink-950 text-white border border-ink-950 hover:bg-ink-800 active:bg-black focus-visible:ring-ink-400 shadow-xs',
    link:
        'bg-transparent text-brand-500 border border-transparent hover:text-brand-600 underline-offset-2 hover:underline focus-visible:ring-brand p-0',
};

const sizeClasses: Record<ButtonSize, string> = {
    sm:  'h-8  px-3   text-xs   gap-1.5 rounded-lg',
    md:  'h-10 px-4   text-sm   gap-2   rounded-lg',
    lg:  'h-12 px-5   text-base gap-2   rounded-xl',
    xl:  'h-14 px-6   text-base gap-2.5 rounded-xl',
};

export default function Button({
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    iconRight,
    fullWidth = false,
    href,
    className,
    disabled,
    children,
    ...props
}: ButtonProps) {
    const base = cn(
        'inline-flex items-center justify-center font-medium transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-40 select-none',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className,
    );

    const content = (
        <>
            {loading ? <Spinner size="sm" className="text-current opacity-70" /> : icon}
            {children && <span>{children}</span>}
            {!loading && iconRight}
        </>
    );

    if (href) {
        return (
            <Link href={href} className={base}>
                {content}
            </Link>
        );
    }

    return (
        <motion.button
            whileHover={variant === 'primary' && !disabled && !loading ? { scale: 1.01 } : undefined}
            whileTap={!disabled && !loading ? { scale: 0.98 } : undefined}
            transition={{ duration: 0.1 }}
            className={base}
            disabled={disabled || loading}
            {...(props as object)}
        >
            {content}
        </motion.button>
    );
}
