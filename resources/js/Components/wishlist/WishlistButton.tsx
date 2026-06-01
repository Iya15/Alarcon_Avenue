import { usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import { cn } from '@/lib/cn';
import type { PageProps } from '@/types';

interface Props {
    productId: number;
    /** Pass true when you already know the product is in the wishlist (e.g. from server props) */
    initialState?: boolean;
    /** 'icon' = heart icon only; 'full' = icon + text */
    variant?: 'icon' | 'full';
    className?: string;
}

export default function WishlistButton({
    productId,
    initialState = false,
    variant = 'icon',
    className = '',
}: Props) {
    const { auth } = usePage<PageProps>().props;
    const [wishlisted, setWishlisted] = useState(initialState);
    const [loading, setLoading]       = useState(false);

    const toggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!auth.user) {
            // Guest — redirect to login
            router.visit(route('login'));
            return;
        }

        setLoading(true);
        window.axios
            .post(route('account.wishlist.store'), { product_id: productId })
            .then((res) => {
                setWishlisted(res.data.wishlisted);
            })
            .finally(() => setLoading(false));
    };

    const isFilled = wishlisted;

    if (variant === 'full') {
        return (
            <button
                type="button"
                onClick={toggle}
                disabled={loading}
                aria-label={isFilled ? 'Remove from wishlist' : 'Add to wishlist'}
                className={cn(
                    'flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors',
                    isFilled
                        ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                        : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300 hover:bg-ink-50',
                    loading && 'opacity-60 cursor-not-allowed',
                    className,
                )}
            >
                <HeartIcon filled={isFilled} className="h-4 w-4" />
                {isFilled ? 'Saved' : 'Save to Wishlist'}
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={toggle}
            disabled={loading}
            aria-label={isFilled ? 'Remove from wishlist' : 'Add to wishlist'}
            className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full border transition-colors',
                isFilled
                    ? 'border-red-200 bg-red-50 text-red-500'
                    : 'border-ink-200 bg-white/80 text-ink-400 hover:border-ink-300 hover:text-ink-700',
                loading && 'opacity-60 cursor-not-allowed',
                className,
            )}
        >
            <HeartIcon filled={isFilled} className="h-4 w-4" />
        </button>
    );
}

function HeartIcon({ filled, className }: { filled: boolean; className?: string }) {
    return filled ? (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
        </svg>
    ) : (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
    );
}
