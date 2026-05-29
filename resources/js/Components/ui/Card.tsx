import { cn } from '@/lib/cn';
import { motion } from 'framer-motion';
import {
    type ElementType,
    type HTMLAttributes,
    type ReactNode,
} from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    padding?: 'none' | 'sm' | 'md' | 'lg';
    hoverable?: boolean;
    bordered?: boolean;
    as?: ElementType;
    children?: ReactNode;
}

const paddingClasses = {
    none: '',
    sm:   'p-4',
    md:   'p-6',
    lg:   'p-8',
};

export default function Card({
    padding = 'md',
    hoverable = false,
    bordered = false,
    as: Tag = 'div',
    className,
    children,
    ...props
}: CardProps) {
    const base = cn(
        'rounded-xl bg-surface',
        bordered ? 'border border-ink-200' : 'shadow-sm',
        paddingClasses[padding],
        hoverable && 'cursor-pointer',
        className,
    );

    if (hoverable) {
        return (
            <motion.div
                className={base}
                whileHover={{ y: -2, boxShadow: '0 12px 24px rgba(0,0,0,0.09), 0 4px 8px rgba(0,0,0,0.05)' }}
                transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
                {...(props as object)}
            >
                {children}
            </motion.div>
        );
    }

    return (
        <Tag className={base} {...props}>
            {children}
        </Tag>
    );
}
