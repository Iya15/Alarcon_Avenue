import '../css/app.css';
import './bootstrap';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { lazy, Suspense } from 'react';
import { configureEcho } from '@laravel/echo-react';
import { useCartStore } from './stores/cartStore';

configureEcho({
    broadcaster: 'reverb',
});

// Merge the guest cart into the user cart after a successful login navigation.
// Inertia fires 'navigate' on every page visit; we only act when auth state changes.
let prevUserId: number | null | undefined = undefined;

router.on('navigate', (event) => {
    const props = event.detail.page.props as { auth?: { user?: { id: number } | null } };
    const currentUserId = props.auth?.user?.id ?? null;

    if (prevUserId === null && currentUserId !== null) {
        // User just logged in → merge guest cart
        useCartStore.getState().mergeGuestCart();

        // Merge guest recently-viewed list from localStorage
        try {
            const key = 'aa_rv';
            const ids: number[] = JSON.parse(localStorage.getItem(key) ?? '[]');
            if (ids.length > 0) {
                window.axios.post('/api/account/recently-viewed/merge', { ids })
                    .then(() => localStorage.removeItem(key))
                    .catch(() => {});
            }
        } catch {}
    } else if (prevUserId !== null && currentUserId === null) {
        // User just logged out → clear cart
        useCartStore.getState().clearCart();
    }

    prevUserId = currentUserId;
});

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Code-split every page via React.lazy — each page becomes its own async chunk.
// Vite splits the glob into per-file chunks automatically.
const pages = import.meta.glob('./Pages/**/*.tsx');

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => {
        const page = pages[`./Pages/${name}.tsx`];
        if (!page) throw new Error(`Page not found: ${name}`);
        // Wrap in lazy() so React suspends until the chunk loads
        const LazyPage = lazy(page as () => Promise<{ default: React.ComponentType }>);
        return { default: LazyPage } as unknown as ReturnType<typeof resolvePageComponent>;
    },
    setup({ el, App, props }) {
        const root = createRoot(el);
        // Suspense boundary shows nothing while the page chunk loads (Inertia handles progress)
        root.render(
            <Suspense fallback={null}>
                <App {...props} />
            </Suspense>
        );
    },
    progress: {
        color: '#e7901d',
    },
});
