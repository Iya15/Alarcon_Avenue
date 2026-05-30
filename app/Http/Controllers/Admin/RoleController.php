<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreRoleRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    public function index(): Response
    {
        $roles = Role::with('permissions')
            ->withCount('users')
            ->orderBy('name')
            ->get()
            ->map(fn ($r) => [
                'id'          => $r->id,
                'name'        => $r->name,
                'users_count' => $r->users_count,
                'permissions' => $r->permissions->pluck('name'),
            ]);

        return Inertia::render('Admin/Roles/Index', [
            'roles'       => $roles,
            'permissions' => Permission::orderBy('name')->pluck('name'),
        ]);
    }

    public function store(StoreRoleRequest $request): RedirectResponse
    {
        $role = Role::create(['name' => $request->input('name'), 'guard_name' => 'web']);
        $role->syncPermissions($request->input('permissions', []));

        return back()->with('success', 'Role created.');
    }

    public function update(StoreRoleRequest $request, Role $role): RedirectResponse
    {
        $role->syncPermissions($request->input('permissions', []));

        return back()->with('success', 'Role updated.');
    }

    public function destroy(Role $role): RedirectResponse
    {
        if (in_array($role->name, ['admin', 'staff', 'customer'])) {
            return back()->withErrors(['role' => 'System roles cannot be deleted.']);
        }

        $role->delete();

        return back()->with('success', 'Role deleted.');
    }
}
