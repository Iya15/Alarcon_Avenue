import { useCompareStore } from '@/stores/compareStore';
import { Link } from '@inertiajs/react';

interface Props {
    productId: number;
    className?: string;
}

export default function AddToCompareButton({ productId, className = '' }: Props) {
    const { toggle, has, isFull, ids } = useCompareStore();
    const isIn   = has(productId);
    const locked = !isIn && isFull();

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <button
                type="button"
                onClick={() => toggle(productId)}
                disabled={locked}
                title={locked ? 'Remove a product to add another (max 4)' : isIn ? 'Remove from compare' : 'Add to compare'}
                className={[
                    'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition',
                    isIn
                        ? 'border-brand bg-brand/10 text-brand'
                        : 'border-ink-200 bg-white text-ink-600 hover:border-ink-400',
                    locked ? 'cursor-not-allowed opacity-40' : '',
                ].join(' ')}
            >
                <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2 8h12M8 2v12" />
                </svg>
                {isIn ? 'Added' : 'Compare'}
            </button>

            {ids.length >= 2 && (
                <Link
                    href={route('compare.index') + '?' + ids.map((id) => `ids[]=${id}`).join('&')}
                    className="text-xs font-medium text-brand underline underline-offset-2 hover:no-underline"
                >
                    Compare ({ids.length})
                </Link>
            )}
        </div>
    );
}
