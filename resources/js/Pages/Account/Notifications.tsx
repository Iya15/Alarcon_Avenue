import Badge from '@/Components/ui/Badge';
import Button from '@/Components/ui/Button';
import EmptyState from '@/Components/ui/EmptyState';
import AccountLayout from '@/Components/account/AccountLayout';
import { cn } from '@/lib/cn';
import type { PageProps } from '@/types';
import { Head, router } from '@inertiajs/react';

interface Notification { id: string; type: string; data: Record<string, unknown>; read_at: string | null; created_at: string }
interface Props extends PageProps {
    notifications: { data: Notification[]; links: { url: string | null; label: string; active: boolean }[] };
    unread_count: number;
}

export default function AccountNotifications({ notifications, unread_count }: Props) {
    return (
        <AccountLayout title="Notifications">
            <Head title="Notifications" />

            <div className="mb-4 flex items-center justify-between">
                {unread_count > 0 && <Badge variant="brand">{unread_count} unread</Badge>}
                {unread_count > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => router.post(route('account.notifications.read-all'))}>
                        Mark all as read
                    </Button>
                )}
            </div>

            {notifications.data.length === 0 ? (
                <EmptyState title="No notifications" description="You're all caught up!" />
            ) : (
                <div className="space-y-2">
                    {notifications.data.map((n) => (
                        <div key={n.id}
                            className={cn('rounded-xl border p-4 transition-colors', n.read_at ? 'border-ink-200 bg-surface' : 'border-brand-200 bg-brand-50')}>
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-ink-900">{n.type}</p>
                                    {n.data.message != null && <p className="mt-0.5 text-xs text-ink-500">{String(n.data.message)}</p>}
                                    <p className="mt-1 text-[11px] text-ink-400">
                                        {new Date(n.created_at).toLocaleDateString('en-PH', { dateStyle: 'medium' })}
                                    </p>
                                </div>
                                {!n.read_at && (
                                    <button onClick={() => router.patch(route('account.notifications.read', n.id))}
                                        className="shrink-0 text-xs text-brand-600 hover:text-brand-700">
                                        Mark read
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </AccountLayout>
    );
}
