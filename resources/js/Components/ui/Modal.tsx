import { cn } from '@/lib/cn';
import { backdrop, scaleIn } from '@/lib/motion';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { type ReactNode } from 'react';

export interface ModalProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    closeable?: boolean;
    footer?: ReactNode;
    children: ReactNode;
}

const sizeClasses = {
    sm:   'max-w-sm',
    md:   'max-w-md',
    lg:   'max-w-lg',
    xl:   'max-w-xl',
    full: 'max-w-[calc(100vw-2rem)]',
};

export default function Modal({
    open,
    onClose,
    title,
    description,
    size = 'md',
    closeable = true,
    footer,
    children,
}: ModalProps) {
    return (
        <AnimatePresence>
            {open && (
                <Dialog
                    open={open}
                    onClose={closeable ? onClose : () => {}}
                    className="relative z-50"
                >
                    <motion.div
                        className="fixed inset-0 bg-black/40 backdrop-blur-[2px]"
                        variants={backdrop}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        aria-hidden="true"
                    />

                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <motion.div
                            className={cn('w-full', sizeClasses[size])}
                            variants={scaleIn}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                        >
                            <DialogPanel className="w-full overflow-hidden rounded-2xl bg-surface shadow-xl">
                                {closeable && (
                                    <button
                                        onClick={onClose}
                                        className="absolute right-4 top-4 z-10 rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                                        aria-label="Close"
                                    >
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}

                                <div className={cn('relative', title ? 'pt-6 px-6' : 'p-0')}>
                                    {title && (
                                        <div className="mb-4 pr-8">
                                            <DialogTitle className="text-lg font-semibold text-ink-950 tracking-tight">
                                                {title}
                                            </DialogTitle>
                                            {description && (
                                                <p className="mt-1 text-sm text-ink-500">{description}</p>
                                            )}
                                        </div>
                                    )}
                                    <div className={cn(!title && 'p-6')}>{children}</div>
                                </div>

                                {footer && (
                                    <div className="flex items-center justify-end gap-3 border-t border-ink-100 px-6 py-4">
                                        {footer}
                                    </div>
                                )}
                            </DialogPanel>
                        </motion.div>
                    </div>
                </Dialog>
            )}
        </AnimatePresence>
    );
}
