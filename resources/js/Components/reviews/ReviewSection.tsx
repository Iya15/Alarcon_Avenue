import { useState } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import type { PageProps } from '@/types';
import Button from '@/Components/ui/Button';
import Modal from '@/Components/ui/Modal';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ReviewMedia {
    id: number;
    url: string;
    type: string;
    sort_order: number;
}

interface ReviewUser {
    id: number;
    name: string;
}

export interface Review {
    id: number;
    rating: number;
    title: string | null;
    body: string | null;
    verified_purchase: boolean;
    helpful_count: number;
    created_at: string;
    user: ReviewUser;
    media: ReviewMedia[];
}

interface ReviewSectionProps {
    productId: number;
    productSlug: string;
    reviews: Review[];
    ratingAverage: number | null;
    reviewCount: number;
}

type SortKey = 'newest' | 'highest' | 'lowest' | 'helpful';

// ── Helpers ───────────────────────────────────────────────────────────────────

function StarRow({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' }) {
    const px = size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5';
    return (
        <div className="flex">
            {[1, 2, 3, 4, 5].map((s) => (
                <svg
                    key={s}
                    className={`${px} ${s <= rating ? 'text-[#e7901d]' : 'text-ink-200'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
        </div>
    );
}

function InteractiveStars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    const [hovered, setHovered] = useState(0);
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
                <button
                    key={s}
                    type="button"
                    onClick={() => onChange(s)}
                    onMouseEnter={() => setHovered(s)}
                    onMouseLeave={() => setHovered(0)}
                    className="focus:outline-none"
                    aria-label={`Rate ${s} star${s > 1 ? 's' : ''}`}
                >
                    <svg
                        className={`h-8 w-8 transition-colors ${s <= (hovered || value) ? 'text-[#e7901d]' : 'text-ink-200'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                </button>
            ))}
        </div>
    );
}

// ── Lightbox ──────────────────────────────────────────────────────────────────

function Lightbox({ media, startIndex, onClose }: { media: ReviewMedia[]; startIndex: number; onClose: () => void }) {
    const [current, setCurrent] = useState(startIndex);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={onClose}
        >
            <button
                className="absolute right-4 top-4 text-white/70 hover:text-white"
                onClick={onClose}
                aria-label="Close"
            >
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            <div className="relative max-h-[85vh] max-w-3xl" onClick={(e) => e.stopPropagation()}>
                <img
                    src={media[current].url}
                    alt={`Review photo ${current + 1}`}
                    className="max-h-[80vh] max-w-full rounded-xl object-contain"
                />
                {media.length > 1 && (
                    <div className="mt-3 flex justify-center gap-2">
                        {media.map((m, i) => (
                            <button
                                key={m.id}
                                onClick={() => setCurrent(i)}
                                className={`h-12 w-12 overflow-hidden rounded-lg border-2 transition-colors ${
                                    i === current ? 'border-[#e7901d]' : 'border-transparent'
                                }`}
                            >
                                <img src={m.url} alt="" className="h-full w-full object-cover" />
                            </button>
                        ))}
                    </div>
                )}
                {media.length > 1 && (
                    <>
                        {current > 0 && (
                            <button
                                onClick={() => setCurrent((c) => c - 1)}
                                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/70"
                                aria-label="Previous"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                </svg>
                            </button>
                        )}
                        {current < media.length - 1 && (
                            <button
                                onClick={() => setCurrent((c) => c + 1)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/70"
                                aria-label="Next"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                </svg>
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

// ── Review card ───────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: Review }) {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxStart, setLightboxStart] = useState(0);
    const [voted, setVoted] = useState(false);
    const [helpfulCount, setHelpfulCount] = useState(review.helpful_count);

    function openLightbox(i: number) {
        setLightboxStart(i);
        setLightboxOpen(true);
    }

    function handleVote() {
        if (voted) return;
        window.axios
            .post(`/reviews/${review.id}/vote`)
            .then((res) => {
                if (res.data.voted) {
                    setVoted(true);
                    setHelpfulCount(res.data.helpful_count);
                }
            })
            .catch(() => {});
    }

    return (
        <>
            <div className="py-6 border-b border-ink-100 last:border-0">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-ink-200 flex items-center justify-center text-sm font-semibold text-ink-600">
                            {review.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-ink-900">{review.user.name}</p>
                            <p className="text-xs text-ink-400">
                                {new Date(review.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                        <StarRow rating={review.rating} size="sm" />
                        {review.verified_purchase && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700">
                                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Verified Purchase
                            </span>
                        )}
                    </div>
                </div>

                {review.title && (
                    <h4 className="mt-3 text-sm font-semibold text-ink-900">{review.title}</h4>
                )}
                {review.body && (
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{review.body}</p>
                )}

                {review.media.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {review.media.map((m, i) => (
                            <button
                                key={m.id}
                                onClick={() => openLightbox(i)}
                                className="h-16 w-16 overflow-hidden rounded-lg border border-ink-200 hover:border-[#e7901d] transition-colors"
                            >
                                <img src={m.url} alt="" className="h-full w-full object-cover" />
                            </button>
                        ))}
                    </div>
                )}

                <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-ink-400">Helpful?</span>
                    <button
                        onClick={handleVote}
                        disabled={voted}
                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
                            voted
                                ? 'border-[#e7901d] bg-[#e7901d]/10 text-[#e7901d]'
                                : 'border-ink-200 text-ink-500 hover:border-ink-400 hover:text-ink-700'
                        }`}
                    >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z" />
                        </svg>
                        {helpfulCount > 0 ? `${helpfulCount}` : 'Yes'}
                    </button>
                </div>
            </div>

            {lightboxOpen && (
                <Lightbox media={review.media} startIndex={lightboxStart} onClose={() => setLightboxOpen(false)} />
            )}
        </>
    );
}

// ── Submit form ───────────────────────────────────────────────────────────────

function SubmitForm({ productId, productSlug, onSuccess }: { productId: number; productSlug: string; onSuccess: () => void }) {
    const { data, setData, post, processing, errors, reset } = useForm<{
        rating: number;
        title: string;
        body: string;
        photos: File[];
    }>({ rating: 0, title: '', body: '', photos: [] });

    function handlePhotos(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files ?? []).slice(0, 5);
        setData('photos', files);
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (data.rating === 0) return;

        const formData = new FormData();
        formData.append('rating', String(data.rating));
        if (data.title) formData.append('title', data.title);
        if (data.body) formData.append('body', data.body);
        data.photos.forEach((f, i) => formData.append(`photos[${i}]`, f));

        post(route('reviews.store', productSlug), {
            data: formData,
            forceFormData: true,
            onSuccess: () => { reset(); onSuccess(); },
        });
    }

    return (
        <form onSubmit={submit} className="space-y-4">
            <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">Rating <span className="text-red-500">*</span></label>
                <InteractiveStars value={data.rating} onChange={(v) => setData('rating', v)} />
                {errors.rating && <p className="mt-1 text-xs text-red-600">{errors.rating}</p>}
            </div>

            <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">Title</label>
                <input
                    type="text"
                    value={data.title}
                    onChange={(e) => setData('title', e.target.value)}
                    maxLength={150}
                    placeholder="Summarize your experience"
                    className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-900 placeholder-ink-400 focus:border-[#e7901d] focus:outline-none focus:ring-1 focus:ring-[#e7901d]"
                />
                {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
            </div>

            <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">Review</label>
                <textarea
                    value={data.body}
                    onChange={(e) => setData('body', e.target.value)}
                    maxLength={2000}
                    rows={4}
                    placeholder="Share your thoughts about this product"
                    className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-900 placeholder-ink-400 focus:border-[#e7901d] focus:outline-none focus:ring-1 focus:ring-[#e7901d] resize-none"
                />
                {errors.body && <p className="mt-1 text-xs text-red-600">{errors.body}</p>}
            </div>

            <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">Photos <span className="text-ink-400 text-xs font-normal">(max 5, jpg/png/webp, 5 MB each)</span></label>
                <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handlePhotos}
                    className="block text-sm text-ink-600 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-ink-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-ink-700 hover:file:bg-ink-200"
                />
                {data.photos.length > 0 && (
                    <p className="mt-1 text-xs text-ink-400">{data.photos.length} photo{data.photos.length > 1 ? 's' : ''} selected</p>
                )}
                {errors.photos && <p className="mt-1 text-xs text-red-600">{errors.photos as unknown as string}</p>}
            </div>

            <Button type="submit" variant="primary" loading={processing} disabled={data.rating === 0}>
                Submit Review
            </Button>
        </form>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ReviewSection({
    productId,
    productSlug,
    reviews,
    ratingAverage,
    reviewCount,
}: ReviewSectionProps) {
    const { auth } = usePage<PageProps>().props;
    const [sort, setSort] = useState<SortKey>('newest');
    const [formOpen, setFormOpen] = useState(false);

    const sorted = [...reviews].sort((a, b) => {
        if (sort === 'newest')  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        if (sort === 'highest') return b.rating - a.rating;
        if (sort === 'lowest')  return a.rating - b.rating;
        if (sort === 'helpful') return b.helpful_count - a.helpful_count;
        return 0;
    });

    const sortOptions: { key: SortKey; label: string }[] = [
        { key: 'newest',  label: 'Newest' },
        { key: 'highest', label: 'Highest rated' },
        { key: 'lowest',  label: 'Lowest rated' },
        { key: 'helpful', label: 'Most helpful' },
    ];

    return (
        <div className="mt-16 border-t border-ink-200 pt-10">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-semibold tracking-tight text-ink-950">
                        Reviews
                        {reviewCount > 0 && <span className="ml-2 text-ink-400 font-normal">({reviewCount})</span>}
                    </h2>
                    {ratingAverage !== null && reviewCount > 0 && (
                        <div className="mt-1.5 flex items-center gap-2">
                            <StarRow rating={Math.round(ratingAverage)} />
                            <span className="text-sm text-ink-500">{ratingAverage.toFixed(1)} out of 5</span>
                        </div>
                    )}
                </div>

                {auth.user ? (
                    <Button variant="secondary" size="sm" onClick={() => setFormOpen(true)}>
                        Write a Review
                    </Button>
                ) : (
                    <a
                        href={route('login')}
                        className="text-sm text-[#e7901d] underline underline-offset-2 hover:text-[#c97a18]"
                    >
                        Sign in to review
                    </a>
                )}
            </div>

            {/* Sort controls */}
            {reviews.length > 1 && (
                <div className="mt-4 flex flex-wrap gap-2">
                    {sortOptions.map((opt) => (
                        <button
                            key={opt.key}
                            onClick={() => setSort(opt.key)}
                            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                                sort === opt.key
                                    ? 'border-[#e7901d] bg-[#e7901d]/10 text-[#e7901d] font-medium'
                                    : 'border-ink-200 text-ink-500 hover:border-ink-400'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Review list */}
            {sorted.length === 0 ? (
                <p className="mt-6 text-sm text-ink-500">No reviews yet. Be the first to share your experience.</p>
            ) : (
                <div className="mt-4 divide-y divide-ink-100">
                    {sorted.map((r) => <ReviewCard key={r.id} review={r} />)}
                </div>
            )}

            {/* Write review modal */}
            <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Write a Review" size="lg">
                <SubmitForm
                    productId={productId}
                    productSlug={productSlug}
                    onSuccess={() => setFormOpen(false)}
                />
            </Modal>
        </div>
    );
}
