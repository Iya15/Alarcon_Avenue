import { cn } from '@/lib/cn';
import { toastItem } from '@/lib/motion';
import { useToastStore, type Toast } from '@/stores/toastStore';
import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import Spinner from './Spinner';

const variantIcons: Record<string, React.ReactNode> = {
    success: (
        <svg className="h-4 w-4 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
    ),
    error: (
        <svg className="h-4 w-4 text-danger-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
    ),
    warning: (
        <svg className="h-4 w-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
    ),
};

const variantBorder: Record<string, string> = {
    success: 'border-l-4 border-l-success-500',
    error:   'border-l-4 border-l-danger-500',
    warning: 'border-l-4 border-l-brand-500',
    loading: 'border-l-4 border-l-ink-300',
    default: '',
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
    const icon = toast.icon
        ?? (toast.variant === 'loading' ? <Spinner size="sm" /> : variantIcons[toast.variant ?? 'default']);

    return (
        <motion.div
            layout
            variants={toastItem}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
                'relative w-80 max-w-[calc(100vw-2rem)] rounded-xl bg-surface shadow-lg',
                'flex items-start gap-3 p-4',
                'border border-ink-200',
                variantBorder[toast.variant ?? 'default'],
            )}
        >
            {icon && (
                <span className="mt-0.5 shrink-0">{icon}</span>
            )}

            <div className="min-w-0 flex-1">
                {toast.title && (
                    <p className="text-sm font-semibold text-ink-950">{toast.title}</p>
                )}
                {toast.description && (
                    <p className="mt-0.5 text-xs text-ink-500">{toast.description}</p>
                )}
                {toast.action && (
                    <button
                        onClick={toast.action.onClick}
                        className="mt-2 text-xs font-medium text-brand-600 hover:text-brand-700 focus:outline-none"
                    >
                        {toast.action.label}
                    </button>
                )}
            </div>

            {toast.variant !== 'loading' && (
                <button
                    onClick={onDismiss}
                    className="shrink-0 rounded p-0.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-600 focus:outline-none"
                    aria-label="Dismiss"
                >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}
        </motion.div>
    );
}

export function Toaster() {
    const { toasts, remove } = useToastStore();

    if (typeof document === 'undefined') return null;

    return createPortal(
        <div
            aria-live="polite"
            aria-label="Notifications"
            className="fixed bottom-4 right-4 z-[9999] flex flex-col items-end gap-2 sm:bottom-6 sm:right-6"
        >
            <AnimatePresence initial={false} mode="popLayout">
                {toasts.map((toast) => (
                    <ToastItem
                        key={toast.id}
                        toast={toast}
                        onDismiss={() => remove(toast.id)}
                    />
                ))}
            </AnimatePresence>
        </div>,
        document.body,
    );
}

export default Toaster;
