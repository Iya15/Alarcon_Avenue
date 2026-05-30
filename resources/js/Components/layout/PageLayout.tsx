import CartDrawer from '@/Components/cart/CartDrawer';
import ChatWidget from '@/Components/assistant/ChatWidget';
import { Toaster } from '@/Components/ui/Toast';
import { useCartStore } from '@/stores/cartStore';
import { type ReactNode, useEffect } from 'react';
import type { BreadcrumbItem } from './Breadcrumbs';
import Breadcrumbs from './Breadcrumbs';
import Container from './Container';
import Footer from './Footer';
import MobileActionBar from './MobileActionBar';
import Navbar from './Navbar';

export interface PageLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
    transparent?: boolean;
    showFooter?: boolean;
}

export default function PageLayout({
    children,
    breadcrumbs,
    transparent = false,
    showFooter = true,
}: PageLayoutProps) {
    const { fetchCart, isInitialized } = useCartStore();

    useEffect(() => {
        if (!isInitialized) {
            fetchCart();
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="flex min-h-screen flex-col bg-canvas">
            <Navbar transparent={transparent} />

            {breadcrumbs && breadcrumbs.length > 0 && (
                <div className="border-b border-ink-100 bg-surface py-3">
                    <Container>
                        <Breadcrumbs items={breadcrumbs} />
                    </Container>
                </div>
            )}

            <main className="flex-1 pb-20 lg:pb-0">{children}</main>

            {showFooter && <Footer />}

            <MobileActionBar />
            <CartDrawer />
            <ChatWidget />
            <Toaster />
        </div>
    );
}
