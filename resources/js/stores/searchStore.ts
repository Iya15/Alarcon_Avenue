import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface Suggestion {
    label: string;
    slug: string;
}

interface SearchState {
    query: string;
    suggestions: Suggestion[];
    recentSearches: string[];
    isLoadingSuggestions: boolean;

    setQuery: (q: string) => void;
    setSuggestions: (s: Suggestion[]) => void;
    setLoadingSuggestions: (v: boolean) => void;
    addRecentSearch: (q: string) => void;
    removeRecentSearch: (q: string) => void;
    clearRecentSearches: () => void;
}

export const useSearchStore = create<SearchState>()(
    persist(
        (set) => ({
            query: '',
            suggestions: [],
            recentSearches: [],
            isLoadingSuggestions: false,

            setQuery: (q) => set({ query: q }),
            setSuggestions: (s) => set({ suggestions: s }),
            setLoadingSuggestions: (v) => set({ isLoadingSuggestions: v }),

            addRecentSearch: (q) =>
                set((state) => ({
                    recentSearches: [
                        q,
                        ...state.recentSearches.filter((s) => s !== q),
                    ].slice(0, 8),
                })),

            removeRecentSearch: (q) =>
                set((state) => ({
                    recentSearches: state.recentSearches.filter((s) => s !== q),
                })),

            clearRecentSearches: () => set({ recentSearches: [] }),
        }),
        {
            name: 'alarcon-search',
            storage: createJSONStorage(() => localStorage),
            partialize: (state: SearchState) => ({ recentSearches: state.recentSearches }),
        },
    ),
);
