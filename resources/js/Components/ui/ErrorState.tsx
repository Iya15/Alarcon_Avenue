import { type ReactNode } from 'react';
import Button from './Button';

export interface ErrorStateProps {
    title?: string;
    description?: string;
    onRetry?: () => void;
    code?: number;
    children?: ReactNode;
}

const codeMessages: Record<number, { title: string; description: string }> = {
    404: {
        title: 'Page not found',
        description: "We couldn't find what you were looking for. It may have moved or no longer exists.",
    },
    403: {
        title: 'Access denied',
        description: "You don't have permission to view this page.",
    },
    500: {
        title: 'Something went wrong',
        description: "We're experiencing technical difficulties. Please try again in a moment.",
    },
};

export default function ErrorState({
    title,
    description,
    onRetry,
    code,
    children,
}: ErrorStateProps) {
    const defaults = code ? codeMessages[code] : null;
    const heading = title ?? defaults?.title ?? 'Something went wrong';
    const body    = description ?? defaults?.description ?? 'An unexpected error occurred.';

    return (
        <div className="flex flex-col items-center py-16 text-center">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-100">
                {code === 404 ? (
                    <svg className="h-7 w-7 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                ) : (
                    <svg className="h-7 w-7 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                )}
            </div>

            {code && (
                <p className="mb-1 text-xs font-medium uppercase tracking-widest text-ink-400">
                    Error {code}
                </p>
            )}
            <h2 className="text-lg font-semibold tracking-tight text-ink-950">{heading}</h2>
            <p className="mt-2 max-w-sm text-sm text-ink-500">{body}</p>

            {children}

            {onRetry && (
                <div className="mt-6">
                    <Button variant="secondary" size="md" onClick={onRetry}>
                        Try again
                    </Button>
                </div>
            )}
        </div>
    );
}
