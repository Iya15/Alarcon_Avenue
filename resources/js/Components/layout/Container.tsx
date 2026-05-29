import { cn } from '@/lib/cn';
import { type HTMLAttributes } from 'react';

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

const sizeClasses = {
    sm:   'max-w-container-sm',
    md:   'max-w-container-md',
    lg:   'max-w-container-lg',
    xl:   'max-w-container-xl',
    '2xl':'max-w-container-2xl',
    full: 'max-w-full',
};

export default function Container({ size = 'xl', className, children, ...props }: ContainerProps) {
    return (
        <div
            className={cn(
                'mx-auto w-full px-4 sm:px-6 lg:px-8',
                sizeClasses[size],
                className,
            )}
            {...props}
        >
            {children}
        </div>
    );
}
