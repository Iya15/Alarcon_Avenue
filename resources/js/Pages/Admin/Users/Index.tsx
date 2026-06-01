import AdminLayout from '@/Components/layout/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import type { PageProps } from '@/types';

interface User {
    id: number; name: string; email: string; phone: string | null;
    is_active: boolean; email_verified_at: string | null; created_at: string;
    roles: string[];
}

interface Props extends PageProps {
    users: { data: User[]; links: { url: string | null; label: string; active: boolean }[] };
    filters: { search?: string; role?: string };
    roles: string[];
}

export default function AdminUsersIndex({ users, filters, roles }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const applySearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.users.index'), { search, role: filters.role }, { preserveState: true });
    };

    return (
        <AdminLayout title="Users">
            <Head title="Users — Admin" />

            <div className="mb-5 flex flex-wrap items-center gap-3">
                <form onSubmit={applySearch} className="flex gap-2">
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Name or email…"
                        className="rounded-lg bg-surface border border-ink-200 px-3 py-1.5 text-sm text-ink-900 placeholder-ink-400 focus:border-[#e7901d] focus:outline-none w-52"
                    />
                    <button type="submit" className="rounded-lg bg-ink-900 px-3 py-1.5 text-sm text-ink-50 hover:bg-ink-800">Search</button>
                </form>
                <select
                    value={filters.role ?? ''}
                    onChange={(e) => router.get(route('admin.users.index'), { search: filters.search, role: e.target.value || undefined }, { preserveState: true })}
                    className="rounded-lg bg-surface border border-ink-200 px-3 py-1.5 text-sm text-ink-900 focus:outline-none"
                >
                    <option value="">All roles</option>
                    {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
            </div>

            <div className="overflow-hidden rounded-xl border border-ink-200 bg-surface">
                <table className="w-full text-sm">
                    <thead className="border-b border-ink-200 bg-canvas">
                        <tr>
                            {['User', 'Roles', 'Status', 'Joined', ''].map((h) => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-ink-500 uppercase">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-200">
                        {users.data.map((u) => (
                            <tr key={u.id} className="hover:bg-ink-50">
                                <td className="px-4 py-3">
                                    <p className="text-ink-900 text-xs font-medium">{u.name}</p>
                                    <p className="text-ink-400 text-xs">{u.email}</p>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-1">
                                        {u.roles.map((r) => (
                                            <span key={r} className="rounded-full bg-ink-100 px-2 py-0.5 text-xs text-ink-700">{r}</span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`text-xs font-medium ${u.is_active ? 'text-green-600' : 'text-red-600'}`}>
                                        {u.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                    {!u.email_verified_at && <span className="ml-1 text-xs text-yellow-600">(unverified)</span>}
                                </td>
                                <td className="px-4 py-3 text-xs text-ink-400">{new Date(u.created_at).toLocaleDateString('en-PH')}</td>
                                <td className="px-4 py-3 text-right">
                                    <Link href={route('admin.users.show', u.id)} className="text-xs text-[#e7901d] hover:underline">Manage</Link>
                                </td>
                            </tr>
                        ))}
                        {users.data.length === 0 && (
                            <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-ink-500">No users found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 flex gap-1">
                {users.links.map((l, i) => (
                    <button
                        key={i}
                        disabled={!l.url}
                        onClick={() => l.url && router.get(l.url)}
                        className={`rounded px-3 py-1.5 text-xs ${l.active ? 'bg-[#e7901d] text-white' : l.url ? 'bg-ink-100 text-ink-700 hover:bg-ink-200' : 'bg-canvas text-ink-400 cursor-not-allowed'}`}
                        dangerouslySetInnerHTML={{ __html: l.label }}
                    />
                ))}
            </div>
        </AdminLayout>
    );
}
