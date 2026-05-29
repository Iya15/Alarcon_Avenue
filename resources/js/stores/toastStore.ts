import { create } from 'zustand';

export type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'loading';

export interface Toast {
    id: string;
    title?: string;
    description?: string;
    variant?: ToastVariant;
    duration?: number;
    action?: { label: string; onClick: () => void };
    icon?: React.ReactNode;
}

interface ToastStore {
    toasts: Toast[];
    add: (toast: Omit<Toast, 'id'>) => string;
    remove: (id: string) => void;
    clear: () => void;
}

export const useToastStore = create<ToastStore>((set) => ({
    toasts: [],

    add: (toast) => {
        const id = Math.random().toString(36).slice(2, 9);
        set((state) => ({
            toasts: [...state.toasts.slice(-2), { ...toast, id }],
        }));
        const duration = toast.duration ?? (toast.variant === 'loading' ? 0 : 4000);
        if (duration > 0) {
            setTimeout(() => {
                set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
            }, duration);
        }
        return id;
    },

    remove: (id) =>
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

    clear: () => set({ toasts: [] }),
}));

export function useToast() {
    const { add, remove } = useToastStore();

    const toast = Object.assign(
        (opts: Omit<Toast, 'id'>) => add(opts),
        {
            success: (title: string, opts?: Partial<Omit<Toast, 'id' | 'variant'>>) =>
                add({ ...opts, title, variant: 'success' }),
            error: (title: string, opts?: Partial<Omit<Toast, 'id' | 'variant'>>) =>
                add({ ...opts, title, variant: 'error' }),
            warning: (title: string, opts?: Partial<Omit<Toast, 'id' | 'variant'>>) =>
                add({ ...opts, title, variant: 'warning' }),
            loading: (title: string, opts?: Partial<Omit<Toast, 'id' | 'variant'>>) =>
                add({ ...opts, title, variant: 'loading', duration: 0 }),
            dismiss: remove,
        },
    );

    return toast;
}
