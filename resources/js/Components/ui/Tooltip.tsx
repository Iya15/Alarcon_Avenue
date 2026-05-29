import { cn } from '@/lib/cn';
import { AnimatePresence, motion } from 'framer-motion';
import {
    cloneElement,
    type ReactElement,
    type ReactNode,
    useRef,
    useState,
} from 'react';

export type TooltipSide = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
    content: ReactNode;
    side?: TooltipSide;
    delay?: number;
    maxWidth?: number;
    children: ReactElement;
}

const positionClasses: Record<TooltipSide, string> = {
    top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left:   'right-full top-1/2 -translate-y-1/2 mr-2',
    right:  'left-full top-1/2 -translate-y-1/2 ml-2',
};

const arrowClasses: Record<TooltipSide, string> = {
    top:    'top-full left-1/2 -translate-x-1/2 border-t-ink-950',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-ink-950',
    left:   'left-full top-1/2 -translate-y-1/2 border-l-ink-950',
    right:  'right-full top-1/2 -translate-y-1/2 border-r-ink-950',
};

export default function Tooltip({
    content,
    side = 'top',
    delay = 400,
    maxWidth = 240,
    children,
}: TooltipProps) {
    const [visible, setVisible] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout>>();

    const show = () => {
        timer.current = setTimeout(() => setVisible(true), delay);
    };

    const hide = () => {
        clearTimeout(timer.current);
        setVisible(false);
    };

    return (
        <span
            className="relative inline-flex"
            onMouseEnter={show}
            onMouseLeave={hide}
            onFocus={show}
            onBlur={hide}
        >
            {cloneElement(children)}

            <AnimatePresence>
                {visible && (
                    <motion.div
                        role="tooltip"
                        className={cn(
                            'pointer-events-none absolute z-50 whitespace-normal',
                            positionClasses[side],
                        )}
                        style={{ width: maxWidth }}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1, transition: { duration: 0.12 } }}
                        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.08 } }}
                    >
                        <div className="rounded-lg bg-ink-950 px-3 py-2 text-xs text-white shadow-lg">
                            {content}
                        </div>
                        <span
                            className={cn(
                                'absolute h-0 w-0 border-4 border-transparent',
                                arrowClasses[side],
                            )}
                            aria-hidden="true"
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </span>
    );
}
