import AdminLayout from '@/Components/layout/AdminLayout';
import { Head, router, useForm } from '@inertiajs/react';
import type { PageProps } from '@/types';

interface Role { id: number; name: string; users_count: number; permissions: string[] }

interface Props extends PageProps { roles: Role[]; permissions: string[] }

export default function AdminRolesIndex({ roles, permissions }: Props) {
    const createForm = useForm({ name: '', permissions: [] as string[] });

    function submitCreate(e: React.FormEvent) {
        e.preventDefault();
        createForm.post(route('admin.roles.store'), { onSuccess: () => createForm.reset() });
    }

    function destroy(id: number, name: string) {
        if (confirm(`Delete role "${name}"?`)) router.delete(route('admin.roles.destroy', id));
    }

    return (
        <AdminLayout title="Roles & Permissions">
            <Head title="Roles — Admin" />
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Role list */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-ink-900">Roles</h3>
                    {roles.map((r) => (
                        <div key={r.id} className="rounded-xl border border-ink-200 bg-surface p-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-ink-900">{r.name}</p>
                                    <p className="text-xs text-ink-400">{r.users_count} user{r.users_count !== 1 ? 's' : ''}</p>
                                </div>
                                {!['admin', 'staff', 'customer'].includes(r.name) && (
                                    <button onClick={() => destroy(r.id, r.name)} className="text-xs text-red-500 hover:underline">Delete</button>
                                )}
                            </div>
                            {r.permissions.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                    {r.permissions.map((p) => (
                                        <span key={p} className="rounded bg-ink-100 px-1.5 py-0.5 text-xs text-ink-700">{p}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Create role */}
                <div>
                    <h3 className="mb-3 text-sm font-semibold text-ink-900">Create Role</h3>
                    <form onSubmit={submitCreate} className="rounded-xl border border-ink-200 bg-surface p-5 space-y-4">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-ink-600">Role name</label>
                            <input
                                value={createForm.data.name}
                                onChange={(e) => createForm.setData('name', e.target.value)}
                                placeholder="vendor"
                                className="w-full rounded-lg bg-surface border border-ink-200 px-3 py-2 text-sm text-ink-900 focus:border-[#e7901d] focus:outline-none"
                            />
                            {createForm.errors.name && <p className="mt-1 text-xs text-red-500">{createForm.errors.name}</p>}
                        </div>
                        {permissions.length > 0 && (
                            <div>
                                <label className="mb-2 block text-xs font-medium text-ink-600">Permissions</label>
                                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                                    {permissions.map((p) => (
                                        <label key={p} className="flex items-center gap-1.5 text-xs text-ink-700 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={createForm.data.permissions.includes(p)}
                                                onChange={(e) => {
                                                    const next = e.target.checked
                                                        ? [...createForm.data.permissions, p]
                                                        : createForm.data.permissions.filter((x) => x !== p);
                                                    createForm.setData('permissions', next);
                                                }}
                                                className="accent-[#e7901d]"
                                            />
                                            {p}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                        <button type="submit" disabled={createForm.processing}
                            className="rounded-lg bg-[#e7901d] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:bg-[#c97a18]">
                            Create
                        </button>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
