import Button from '@/Components/ui/Button';
import { useCartStore } from '@/stores/cartStore';
import { useToast } from '@/stores/toastStore';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface Props {
    variantId: number;
    quantity?: number;
    disabled?: boolean;
    outOfStock?: boolean;
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    fullWidth?: boolean;
}

type State = 'idle' | 'loading' | 'added' | 'error';

export default function AddToCartButton({
    variantId,
    quantity = 1,
    disabled = false,
    outOfStock = false,
    className = '',
    size = 'lg',
    fullWidth = true,
}: Props) {
    const { addItem, open } = useCartStore();
    const toast = useToast();
    const [state, setState] = useState<State>('idle');

    const handleClick = async () => {
        if (state !== 'idle' || disabled || outOfStock) return;

        setState('loading');
        try {
            await addItem(variantId, quantity);
            setState('added');

            toast({
                title: 'Added to cart',
                variant: 'success',
                duration: 3000,
                action: { label: 'View cart', onClick: open },
            });

            setTimeout(() => setState('idle'), 1400);
        } catch {
            setState('error');
            setTimeout(() => setState('idle'), 1400);
        }
    };

    if (outOfStock) {
        return (
            <Button variant="secondary" size={size} fullWidth={fullWidth} disabled className={className}>
                Out of Stock
            </Button>
        );
    }

    return (
        <motion.div
            animate={state === 'added' ? { scale: [1, 1.03, 1] } : {}}
            transition={{ duration: 0.25 }}
            className={fullWidth ? 'w-full' : undefined}
        >
            <Button
                variant="primary"
                size={size}
                fullWidth={fullWidth}
                loading={state === 'loading'}
                disabled={disabled}
                className={className}
                onClick={handleClick}
                icon={
                    state === 'added' ? (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                    ) : state === 'error' ? (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : undefined
                }
            >
                {state === 'added'
                    ? 'Added!'
                    : state === 'error'
                    ? 'Try again'
                    : 'Add to Cart'}
            </Button>
        </motion.div>
    );
}
