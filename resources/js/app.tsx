import '../css/app.css';
import './bootstrap';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
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

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(<App {...props} />);
    },
    progress: {
        color: '#e7901d',
    },
});
