import AdminLayout from '@/Components/layout/AdminLayout';
import { Head, router, useForm } from '@inertiajs/react';
import type { PageProps } from '@/types';

interface User {
    id: number; name: string; email: string; phone: string | null;
    is_active: boolean; email_verified_at: string | null; created_at: string;
    roles: string[];
}

interface Props extends PageProps { user: User; roles: string[] }

export default function AdminUserShow({ user, roles }: Props) {
    const roleForm = useForm({ roles: user.roles as string[] });

    function submitRoles(e: React.FormEvent) {
        e.preventDefault();
        roleForm.patch(route('admin.users.assign-role', user.id));
    }

    function toggleActive() {
        router.patch(route('admin.users.toggle-active', user.id));
    }

    return (
        <AdminLayout title={user.name}>
            <Head title={`${user.name} — Admin`} />

            <div className="mb-5">
                <button onClick={() => router.get(route('admin.users.index'))} className="text-xs text-ink-400 hover:text-white">← Users</button>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-xl border border-ink-800 bg-ink-900 p-5">
                    <h3 className="mb-3 text-sm font-semibold text-white">Profile</h3>
                    <dl className="space-y-2 text-xs">
                        {[['Name', user.name], ['Email', user.email], ['Phone', user.phone ?? '—'], ['Joined', new Date(user.created_at).toLocaleDateString('en-PH')], ['Email verified', user.email_verified_at ? '✓' : '✗']].map(([k, v]) => (
                            <div key={k} className="flex justify-between gap-3">
                                <dt className="text-ink-400">{k}</dt>
                                <dd className="text-white text-right">{v}</dd>
                            </div>
                        ))}
                        <div className="flex justify-between gap-3">
                            <dt className="text-ink-400">Status</dt>
                            <dd>
                                <button onClick={toggleActive} className={`text-xs font-medium underline ${user.is_active ? 'text-green-400' : 'text-red-400'}`}>
                                    {user.is_active ? 'Active (deactivate)' : 'Inactive (activate)'}
                                </button>
                            </dd>
                        </div>
                    </dl>
                </div>

                <div className="rounded-xl border border-ink-800 bg-ink-900 p-5 lg:col-span-2">
                    <h3 className="mb-3 text-sm font-semibold text-white">Roles</h3>
                    <form onSubmit={submitRoles} className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                            {roles.map((r) => (
                                <label key={r} className="flex cursor-pointer items-center gap-2 rounded-lg border border-ink-700 px-3 py-2 text-xs text-ink-200 hover:border-[#e7901d]">
                                    <input
                                        type="checkbox"
                                        checked={roleForm.data.roles.includes(r)}
                                        onChange={(e) => {
                                            const next = e.target.checked
                                                ? [...roleForm.data.roles, r]
                                                : roleForm.data.roles.filter((x) => x !== r);
                                            roleForm.setData('roles', next);
                                        }}
                                        className="accent-[#e7901d]"
                                    />
                                    {r}
                                </label>
                            ))}
                        </div>
                        <button
                            type="submit"
                            disabled={roleForm.processing}
                            className="rounded-lg bg-[#e7901d] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:bg-[#c97a18]"
                        >
                            Save roles
                        </button>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
