import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface ThemeStore {
    theme: Theme;
    setTheme: (t: Theme) => void;
    toggle: () => void;
}

function applyTheme(t: Theme) {
    document.documentElement.setAttribute('data-theme', t);
}

export const useThemeStore = create<ThemeStore>()(
    persist(
        (set, get) => ({
            theme: 'light',

            setTheme: (t) => {
                applyTheme(t);
                set({ theme: t });
            },

            toggle: () => {
                const next = get().theme === 'light' ? 'dark' : 'light';
                applyTheme(next);
                set({ theme: next });
            },
        }),
        {
            name: 'aa-theme',
            onRehydrateStorage: () => (state) => {
                // Apply stored theme immediately when the store hydrates on page load
                if (state) applyTheme(state.theme);
            },
        }
    )
);
