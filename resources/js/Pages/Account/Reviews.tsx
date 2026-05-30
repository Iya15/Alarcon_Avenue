import Badge from '@/Components/ui/Badge';
import Button from '@/Components/ui/Button';
import EmptyState from '@/Components/ui/EmptyState';
import Input from '@/Components/ui/Input';
import Modal from '@/Components/ui/Modal';
import AccountLayout from '@/Components/account/AccountLayout';
import { useToast } from '@/stores/toastStore';
import type { PageProps } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

interface Review {
    id: number; rating: number; title: string | null; body: string | null;
    is_approved: boolean; created_at: string;
    product_name: string | null; product_slug: string | null; image_url: string | null;
}
interface Props extends PageProps {
    reviews: { data: Review[]; links: { url: string | null; label: string; active: boolean }[] };
}

function Stars({ rating }: { rating: number }) {
    return (
        <div className="flex">
            {[1,2,3,4,5].map((s) => (
                <svg key={s} className={`h-3.5 w-3.5 ${s <= rating ? 'text-brand-500' : 'text-ink-200'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
        </div>
    );
}

export default function AccountReviews({ reviews }: Props) {
    const toast = useToast();
    const [editReview, setEditReview] = useState<Review | null>(null);
    const { data, setData, patch, processing, errors, reset } = useForm({ rating: 5, title: '', body: '' });

    const openEdit = (r: Review) => {
        setData({ rating: r.rating, title: r.title ?? '', body: r.body ?? '' });
        setEditReview(r);
    };

    return (
        <AccountLayout title="My Reviews">
            <Head title="Reviews" />

            {reviews.data.length === 0 ? (
                <EmptyState title="No reviews yet" description="After purchasing a product, you can leave a review here." />
            ) : (
                <div className="space-y-3">
                    {reviews.data.map((r) => (
                        <div key={r.id} className="flex gap-3 rounded-xl border border-ink-200 bg-surface p-4">
                            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                                {r.image_url && <img src={r.image_url} alt={r.product_name ?? ''} className="h-full w-full object-cover" />}
                            </div>
                            <div className="min-w-0 flex-1">
                                <Link href={r.product_slug ? route('products.show', r.product_slug) : '#'} className="text-sm font-medium text-ink-900 hover:text-brand-600">
                                    {r.product_name}
                                </Link>
                                <div className="mt-0.5 flex items-center gap-2">
                                    <Stars rating={r.rating} />
                                    {!r.is_approved && <Badge variant="warning" size="sm">Pending approval</Badge>}
                                </div>
                                {r.title && <p className="mt-1 text-sm font-medium text-ink-900">{r.title}</p>}
                                {r.body && <p className="mt-0.5 text-xs text-ink-500 line-clamp-2">{r.body}</p>}
                                <div className="mt-2 flex gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>Edit</Button>
                                    <Button variant="ghost" size="sm" onClick={() => { if (confirm('Delete review?')) router.delete(route('account.reviews.destroy', r.id)); }}>Delete</Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal open={editReview !== null} onClose={() => { setEditReview(null); reset(); }} title="Edit review"
                footer={<><Button variant="secondary" onClick={() => setEditReview(null)}>Cancel</Button>
                    <Button type="submit" form="review-form" loading={processing}>Save</Button></>}>
                <form id="review-form" onSubmit={(e) => { e.preventDefault(); patch(route('account.reviews.update', editReview!.id), { onSuccess: () => { setEditReview(null); toast.success('Review updated.'); } }); }}
                    className="space-y-4">
                    <div>
                        <p className="mb-1.5 text-sm font-medium text-ink-800">Rating</p>
                        <div className="flex gap-1">
                            {[1,2,3,4,5].map((s) => (
                                <button key={s} type="button" onClick={() => setData('rating', s)}>
                                    <svg className={`h-6 w-6 ${s <= Number(data.rating) ? 'text-brand-500' : 'text-ink-200'}`} fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                </button>
                            ))}
                        </div>
                    </div>
                    <Input label="Title (optional)" value={String(data.title)} onChange={(e) => setData('title', e.target.value)} />
                    <div>
                        <label className="text-sm font-medium text-ink-800">Review</label>
                        <textarea value={String(data.body)} onChange={(e) => setData('body', e.target.value)} rows={4}
                            className="mt-1.5 w-full rounded-lg border border-ink-200 bg-surface px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500" />
                    </div>
                </form>
            </Modal>
        </AccountLayout>
    );
}
