import { cn } from '@/lib/cn';

interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    rounded?: boolean;
    className?: string;
}

function SkeletonBase({ width = '100%', height = '1em', rounded = false, className }: SkeletonProps) {
    return (
        <span
            className={cn(
                'block animate-shimmer bg-gradient-to-r from-ink-100 via-ink-50 to-ink-100 bg-[length:200%_100%]',
                rounded ? 'rounded-full' : 'rounded-md',
                className,
            )}
            style={{ width, height }}
            aria-hidden="true"
        />
    );
}

function Text({ lines = 1, className }: { lines?: number; className?: string }) {
    return (
        <div className={cn('flex flex-col gap-2', className)}>
            {Array.from({ length: lines }).map((_, i) => (
                <SkeletonBase
                    key={i}
                    height="0.875rem"
                    width={i === lines - 1 && lines > 1 ? '60%' : '100%'}
                />
            ))}
        </div>
    );
}

function Avatar({ size = 40 }: { size?: number }) {
    return <SkeletonBase width={size} height={size} rounded className="shrink-0" />;
}

function Card() {
    return (
        <div className="rounded-xl border border-ink-200 p-5">
            <div className="flex items-start gap-3">
                <Avatar size={44} />
                <div className="flex-1">
                    <SkeletonBase height="0.875rem" width="40%" className="mb-2" />
                    <SkeletonBase height="0.75rem" width="60%" />
                </div>
            </div>
            <div className="mt-4 flex flex-col gap-2">
                <SkeletonBase height="0.8rem" />
                <SkeletonBase height="0.8rem" />
                <SkeletonBase height="0.8rem" width="75%" />
            </div>
        </div>
    );
}

const Skeleton = Object.assign(SkeletonBase, { Text, Avatar, Card });
export default Skeleton;
