import AdminLayout from '@/Components/layout/AdminLayout';
import { Head, useForm } from '@inertiajs/react';
import type { PageProps } from '@/types';

interface Review {
    id: number; rating: number; title: string | null; body: string | null;
    status: string; verified_purchase: boolean; media_count: number;
    created_at: string;
    user: { id: number; name: string };
    product: { id: number; name: string; slug: string };
}

interface Props extends PageProps {
    reviews: { data: Review[]; links: { url: string | null; label: string; active: boolean }[] };
}

function StarRow({ rating }: { rating: number }) {
    return (
        <span className="flex gap-0.5">
            {[1,2,3,4,5].map((s) => (
                <svg key={s} className={`h-3 w-3 ${s <= rating ? 'text-[#e7901d]' : 'text-ink-300'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
        </span>
    );
}

function ReviewRow({ review }: { review: Review }) {
    const approveForm = useForm({ action: 'approve', reason: '' });
    const rejectForm  = useForm({ action: 'reject',  reason: '' });

    return (
        <div className="rounded-xl border border-ink-200 bg-surface p-4 space-y-2">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <StarRow rating={review.rating} />
                        <span className="text-xs text-ink-900 font-medium">{review.user.name}</span>
                        {review.verified_purchase && (
                            <span className="text-xs text-green-700 bg-green-100 rounded-full px-2 py-0.5">Verified</span>
                        )}
                        {review.media_count > 0 && (
                            <span className="text-xs text-ink-400">{review.media_count} photo{review.media_count > 1 ? 's' : ''}</span>
                        )}
                    </div>
                    <p className="mt-1 text-xs text-ink-400">
                        <span className="text-ink-500">Product:</span> {review.product.name} ·{' '}
                        {new Date(review.created_at).toLocaleDateString('en-PH')}
                    </p>
                    {review.title && <p className="mt-1 text-sm font-medium text-ink-900">{review.title}</p>}
                    {review.body  && <p className="mt-0.5 text-xs text-ink-600 line-clamp-3">{review.body}</p>}
                </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
                <form onSubmit={(e) => { e.preventDefault(); approveForm.patch(route('admin.reviews.update', review.id)); }}>
                    <input type="hidden" name="action" value="approve" />
                    <button type="submit" disabled={approveForm.processing}
                        className="rounded-lg bg-green-100 hover:bg-green-200 px-3 py-1.5 text-xs font-medium text-green-700 disabled:opacity-50">
                        Approve
                    </button>
                </form>

                <form onSubmit={(e) => { e.preventDefault(); rejectForm.patch(route('admin.reviews.update', review.id)); }} className="flex gap-2">
                    <input
                        value={rejectForm.data.reason}
                        onChange={(e) => rejectForm.setData('reason', e.target.value)}
                        placeholder="Rejection reason…"
                        className="rounded-lg bg-surface border border-ink-200 px-3 py-1.5 text-xs text-ink-900 placeholder-ink-400 focus:border-red-500 focus:outline-none w-48"
                    />
                    <button type="submit" disabled={rejectForm.processing || !rejectForm.data.reason}
                        className="rounded-lg bg-red-100 hover:bg-red-200 px-3 py-1.5 text-xs font-medium text-red-700 disabled:opacity-50">
                        Reject
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function AdminReviewsIndex({ reviews }: Props) {
    return (
        <AdminLayout title="Review Moderation">
            <Head title="Reviews — Admin" />
            <p className="mb-5 text-sm text-ink-500">{reviews.data.length === 0 ? 'No pending reviews.' : `${reviews.data.length} pending review${reviews.data.length > 1 ? 's' : ''}`}</p>
            <div className="space-y-3">
                {reviews.data.map((r) => <ReviewRow key={r.id} review={r} />)}
            </div>
        </AdminLayout>
    );
}
