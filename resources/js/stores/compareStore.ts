import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const MAX_ITEMS = 4;

interface CompareStore {
    ids: number[];
    add: (id: number) => void;
    remove: (id: number) => void;
    toggle: (id: number) => void;
    clear: () => void;
    has: (id: number) => boolean;
    isFull: () => boolean;
}

export const useCompareStore = create<CompareStore>()(
    persist(
        (set, get) => ({
            ids: [],

            add: (id) => set((s) => {
                if (s.ids.includes(id) || s.ids.length >= MAX_ITEMS) return s;
                return { ids: [...s.ids, id] };
            }),

            remove: (id) => set((s) => ({ ids: s.ids.filter((i) => i !== id) })),

            toggle: (id) => {
                const { ids, add, remove } = get();
                ids.includes(id) ? remove(id) : add(id);
            },

            clear: () => set({ ids: [] }),

            has: (id) => get().ids.includes(id),

            isFull: () => get().ids.length >= MAX_ITEMS,
        }),
        { name: 'aa-compare' }
    )
);
