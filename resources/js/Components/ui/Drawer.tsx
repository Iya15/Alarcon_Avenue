import { cn } from '@/lib/cn';
import { backdrop, drawerBottom, drawerLeft, drawerRight } from '@/lib/motion';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { type ReactNode } from 'react';

export type DrawerSide = 'left' | 'right' | 'bottom';

export interface DrawerProps {
    open: boolean;
    onClose: () => void;
    side?: DrawerSide;
    title?: string;
    size?: 'sm' | 'md' | 'lg' | 'full';
    closeable?: boolean;
    footer?: ReactNode;
    children: ReactNode;
}

const widthClasses = { sm: 'w-72', md: 'w-80', lg: 'w-96', full: 'w-full' };
const heightClasses = { sm: 'max-h-72', md: 'max-h-[50vh]', lg: 'max-h-[75vh]', full: 'h-full' };
const sideVariants = { left: drawerLeft, right: drawerRight, bottom: drawerBottom };

const panelPosition: Record<DrawerSide, string> = {
    left:   'fixed left-0 top-0 bottom-0 flex flex-col',
    right:  'fixed right-0 top-0 bottom-0 flex flex-col',
    bottom: 'fixed bottom-0 left-0 right-0 rounded-t-2xl',
};

export default function Drawer({
    open,
    onClose,
    side = 'right',
    title,
    size = 'md',
    closeable = true,
    footer,
    children,
}: DrawerProps) {
    const isVertical = side === 'bottom';

    return (
        <AnimatePresence>
            {open && (
                <Dialog
                    open={open}
                    onClose={closeable ? onClose : () => {}}
                    className="relative z-50"
                >
                    <motion.div
                        className="fixed inset-0 bg-black/40"
                        variants={backdrop}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        aria-hidden="true"
                    />

                    <motion.div
                        className={cn(
                            'bg-surface shadow-xl',
                            panelPosition[side],
                            isVertical
                                ? heightClasses[size]
                                : widthClasses[size],
                        )}
                        variants={sideVariants[side]}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <DialogPanel className="flex h-full flex-col overflow-hidden">
                            {(title || closeable) && (
                                <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
                                    {title && (
                                        <DialogTitle className="text-base font-semibold text-ink-950">
                                            {title}
                                        </DialogTitle>
                                    )}
                                    {closeable && (
                                        <button
                                            onClick={onClose}
                                            className="ml-auto rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                                            aria-label="Close"
                                        >
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            )}

                            <div className="flex-1 overflow-y-auto p-5">{children}</div>

                            {footer && (
                                <div className="border-t border-ink-100 p-4">{footer}</div>
                            )}
                        </DialogPanel>
                    </motion.div>
                </Dialog>
            )}
        </AnimatePresence>
    );
}
