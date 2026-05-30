import { create } from 'zustand';

export interface CartItem {
    id: number;
    variant_id: number;
    product_id: number | null;
    slug: string | null;
    sku: string | null;
    product_name: string | null;
    brand_name: string | null;
    variant_label: string | null;
    image_url: string | null;
    unit_price_cents: number;
    quantity: number;
    line_total_cents: number;
    saved_for_later: boolean;
    in_stock: boolean;
    available: number;
}

export interface CartTotals {
    subtotal_cents: number;
    discount_cents: number;
    shipping_cents: number;
    tax_cents: number;
    total_cents: number;
    items_count: number;
    coupon: { code: string; type: string; value: number } | null;
    free_shipping_threshold_cents: number;
    free_shipping_remaining_cents: number;
    free_shipping_applied: boolean;
}

export interface CartData {
    items: CartItem[];
    saved_items: CartItem[];
    totals: CartTotals;
    coupon_code: string | null;
}

const EMPTY_TOTALS: CartTotals = {
    subtotal_cents: 0,
    discount_cents: 0,
    shipping_cents: 0,
    tax_cents: 0,
    total_cents: 0,
    items_count: 0,
    coupon: null,
    free_shipping_threshold_cents: 150_000,
    free_shipping_remaining_cents: 150_000,
    free_shipping_applied: false,
};

interface CartState extends CartData {
    isOpen: boolean;
    isLoading: boolean;
    lastAddedVariantId: number | null;
    error: string | null;
    isInitialized: boolean;

    open: () => void;
    close: () => void;
    setCart: (data: CartData) => void;
    setError: (msg: string | null) => void;

    fetchCart: () => Promise<void>;
    addItem: (variantId: number, quantity?: number) => Promise<void>;
    updateItem: (itemId: number, quantity: number) => Promise<void>;
    removeItem: (itemId: number) => Promise<void>;
    saveForLater: (itemId: number) => Promise<void>;
    applyCoupon: (code: string) => Promise<void>;
    removeCoupon: () => Promise<void>;
    mergeGuestCart: () => Promise<void>;
    clearCart: () => void;
}

function csrfToken(): string {
    return (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content ?? '';
}

async function cartRequest(method: string, url: string, body?: object): Promise<CartData> {
    const res = await window.axios.request<CartData>({
        method,
        url,
        data: body,
    });
    return res.data;
}

export const useCartStore = create<CartState>()((set, get) => ({
    items: [],
    saved_items: [],
    totals: EMPTY_TOTALS,
    coupon_code: null,
    isOpen: false,
    isLoading: false,
    lastAddedVariantId: null,
    error: null,
    isInitialized: false,

    open:  () => set({ isOpen: true }),
    close: () => set({ isOpen: false }),

    setCart: (data) => set({
        items:       data.items,
        saved_items: data.saved_items,
        totals:      data.totals,
        coupon_code: data.coupon_code,
    }),

    setError: (msg) => set({ error: msg }),

    clearCart: () => set({
        items:          [],
        saved_items:    [],
        totals:         EMPTY_TOTALS,
        coupon_code:    null,
        isInitialized:  false,
    }),

    fetchCart: async () => {
        if (get().isLoading) return;
        set({ isLoading: true, error: null });
        try {
            const data = await cartRequest('get', '/api/cart');
            set({ ...data, isInitialized: true });
        } catch {
            set({ error: 'Could not load cart.' });
        } finally {
            set({ isLoading: false });
        }
    },

    addItem: async (variantId, quantity = 1) => {
        set({ isLoading: true, error: null, lastAddedVariantId: variantId });
        try {
            const data = await cartRequest('post', '/api/cart/items', { variant_id: variantId, quantity });
            set({ ...data, isOpen: true });
        } catch (err: unknown) {
            const msg = extractError(err) ?? 'Could not add item to cart.';
            set({ error: msg });
            throw new Error(msg);
        } finally {
            set({ isLoading: false, lastAddedVariantId: null });
        }
    },

    updateItem: async (itemId, quantity) => {
        const prev = { items: get().items, saved_items: get().saved_items, totals: get().totals };

        // Optimistic update
        set((s) => ({
            items: s.items.map((i) =>
                i.id === itemId ? { ...i, quantity, line_total_cents: i.unit_price_cents * quantity } : i
            ),
        }));

        try {
            const data = await cartRequest('patch', `/api/cart/items/${itemId}`, { quantity });
            set({ ...data });
        } catch (err: unknown) {
            set(prev); // rollback
            const msg = extractError(err) ?? 'Could not update item.';
            set({ error: msg });
        }
    },

    removeItem: async (itemId) => {
        const prev = { items: get().items, saved_items: get().saved_items, totals: get().totals };

        // Optimistic remove
        set((s) => ({ items: s.items.filter((i) => i.id !== itemId) }));

        try {
            const data = await cartRequest('delete', `/api/cart/items/${itemId}`);
            set({ ...data });
        } catch {
            set(prev);
            set({ error: 'Could not remove item.' });
        }
    },

    saveForLater: async (itemId) => {
        try {
            const data = await cartRequest('patch', `/api/cart/items/${itemId}/save`);
            set({ ...data });
        } catch {
            set({ error: 'Could not update item.' });
        }
    },

    applyCoupon: async (code) => {
        set({ isLoading: true, error: null });
        try {
            const data = await cartRequest('post', '/api/cart/coupon', { code });
            set({ ...data });
        } catch (err: unknown) {
            const msg = extractError(err, 'code') ?? 'Invalid coupon code.';
            set({ error: msg });
            throw new Error(msg);
        } finally {
            set({ isLoading: false });
        }
    },

    removeCoupon: async () => {
        try {
            const data = await cartRequest('delete', '/api/cart/coupon');
            set({ ...data });
        } catch {
            set({ error: 'Could not remove coupon.' });
        }
    },

    mergeGuestCart: async () => {
        try {
            const data = await cartRequest('post', '/api/cart/merge');
            set({ ...data, isInitialized: true });
        } catch {
            // Non-fatal — user still has their cart
        }
    },
}));

function extractError(err: unknown, field = 'message'): string | null {
    if (err && typeof err === 'object' && 'response' in err) {
        const res = (err as { response?: { data?: Record<string, unknown> } }).response;
        const data = res?.data;
        if (data) {
            if (field in data && Array.isArray(data[field])) return String((data[field] as string[])[0]);
            if ('errors' in data && typeof data.errors === 'object' && data.errors !== null) {
                const errors = data.errors as Record<string, string[]>;
                const first = Object.values(errors)[0];
                if (Array.isArray(first)) return String(first[0]);
            }
            if ('message' in data) return String(data.message);
        }
    }
    return null;
}
