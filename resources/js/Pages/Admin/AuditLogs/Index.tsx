import AdminLayout from '@/Components/layout/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import type { PageProps } from '@/types';

interface Log {
    id: number; event: string; auditable_type: string; auditable_id: number;
    old_values: Record<string, unknown> | null; new_values: Record<string, unknown> | null;
    ip_address: string | null; created_at: string;
    user: { id: number; name: string; email: string } | null;
}

interface Props extends PageProps {
    logs: { data: Log[]; links: { url: string | null; label: string; active: boolean }[] };
    filters: { search?: string; event?: string };
}

const EVENT_BADGE: Record<string, string> = {
    created: 'text-green-400 bg-green-900/30',
    updated: 'text-blue-400 bg-blue-900/30',
    deleted: 'text-red-400 bg-red-900/30',
};

export default function AdminAuditLogsIndex({ logs, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [expanded, setExpanded] = useState<number | null>(null);

    const applySearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.audit-logs.index'), { search, event: filters.event }, { preserveState: true });
    };

    return (
        <AdminLayout title="Audit Logs">
            <Head title="Audit Logs — Admin" />

            <div className="mb-5 flex flex-wrap items-center gap-3">
                <form onSubmit={applySearch} className="flex gap-2">
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Model or user…"
                        className="rounded-lg bg-ink-800 border border-ink-700 px-3 py-1.5 text-sm text-white placeholder-ink-500 focus:border-[#e7901d] focus:outline-none w-52"
                    />
                    <button type="submit" className="rounded-lg bg-ink-700 px-3 py-1.5 text-sm text-white hover:bg-ink-600">Search</button>
                </form>
                <select
                    value={filters.event ?? ''}
                    onChange={(e) => router.get(route('admin.audit-logs.index'), { search: filters.search, event: e.target.value || undefined }, { preserveState: true })}
                    className="rounded-lg bg-ink-800 border border-ink-700 px-3 py-1.5 text-sm text-white focus:outline-none"
                >
                    <option value="">All events</option>
                    <option value="created">Created</option>
                    <option value="updated">Updated</option>
                    <option value="deleted">Deleted</option>
                </select>
            </div>

            <div className="space-y-2">
                {logs.data.map((l) => (
                    <div key={l.id} className="rounded-xl border border-ink-800 bg-ink-900">
                        <button
                            className="w-full flex items-center gap-4 px-4 py-3 text-left"
                            onClick={() => setExpanded(expanded === l.id ? null : l.id)}
                        >
                            <span className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${EVENT_BADGE[l.event] ?? 'text-ink-400 bg-ink-800'}`}>
                                {l.event}
                            </span>
                            <span className="flex-1 min-w-0 text-xs text-white">
                                <span className="font-semibold">{l.auditable_type}</span>
                                <span className="text-ink-400"> #{l.auditable_id}</span>
                            </span>
                            <span className="text-xs text-ink-400 shrink-0">{l.user?.name ?? 'System'}</span>
                            <span className="text-xs text-ink-600 shrink-0">{new Date(l.created_at).toLocaleString('en-PH')}</span>
                            <svg className={`h-4 w-4 text-ink-400 shrink-0 transition-transform ${expanded === l.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {expanded === l.id && (
                            <div className="border-t border-ink-800 p-4 grid grid-cols-2 gap-4">
                                <div>
                                    <p className="mb-2 text-xs font-medium text-ink-400 uppercase">Before</p>
                                    <pre className="text-xs text-ink-300 whitespace-pre-wrap break-all overflow-auto max-h-48">
                                        {l.old_values ? JSON.stringify(l.old_values, null, 2) : '—'}
                                    </pre>
                                </div>
                                <div>
                                    <p className="mb-2 text-xs font-medium text-ink-400 uppercase">After</p>
                                    <pre className="text-xs text-ink-300 whitespace-pre-wrap break-all overflow-auto max-h-48">
                                        {l.new_values ? JSON.stringify(l.new_values, null, 2) : '—'}
                                    </pre>
                                </div>
                                {l.ip_address && (
                                    <p className="col-span-2 text-xs text-ink-500">IP: {l.ip_address}</p>
                                )}
                            </div>
                        )}
                    </div>
                ))}
                {logs.data.length === 0 && (
                    <div className="rounded-xl border border-ink-800 bg-ink-900 px-4 py-8 text-center text-sm text-ink-500">No log entries found.</div>
                )}
            </div>

            <div className="mt-4 flex gap-1">
                {logs.links.map((l, i) => (
                    <button key={i} disabled={!l.url} onClick={() => l.url && router.get(l.url)}
                        className={`rounded px-3 py-1.5 text-xs ${l.active ? 'bg-[#e7901d] text-white' : l.url ? 'bg-ink-800 text-ink-300 hover:bg-ink-700' : 'bg-ink-900 text-ink-600 cursor-not-allowed'}`}
                        dangerouslySetInnerHTML={{ __html: l.label }} />
                ))}
            </div>
        </AdminLayout>
    );
}
