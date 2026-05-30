<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AssignUserRoleRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $users = User::with('roles')
            ->when($request->input('search'), fn ($q, $s) =>
                $q->where('name', 'ilike', "%{$s}%")
                  ->orWhere('email', 'ilike', "%{$s}%")
            )
            ->when($request->input('role'), fn ($q, $r) => $q->role($r))
            ->orderByDesc('created_at')
            ->paginate(25)
            ->withQueryString()
            ->through(fn ($u) => $this->formatUser($u));

        return Inertia::render('Admin/Users/Index', [
            'users'   => $users,
            'filters' => $request->only('search', 'role'),
            'roles'   => Role::orderBy('name')->pluck('name'),
        ]);
    }

    public function show(User $user): Response
    {
        $user->load('roles');

        return Inertia::render('Admin/Users/Show', [
            'user'  => $this->formatUser($user),
            'roles' => Role::orderBy('name')->pluck('name'),
        ]);
    }

    public function assignRole(AssignUserRoleRequest $request, User $user): RedirectResponse
    {
        $user->syncRoles($request->input('roles', []));

        return back()->with('success', 'Roles updated.');
    }

    public function toggleActive(Request $request, User $user): RedirectResponse
    {
        $user->update(['is_active' => ! $user->is_active]);

        return back()->with('success', $user->is_active ? 'User activated.' : 'User deactivated.');
    }

    private function formatUser(User $user): array
    {
        return [
            'id'                => $user->id,
            'name'              => $user->name,
            'email'             => $user->email,
            'phone'             => $user->phone,
            'is_active'         => $user->is_active,
            'email_verified_at' => $user->email_verified_at?->toISOString(),
            'created_at'        => $user->created_at?->toISOString(),
            'roles'             => $user->roles->pluck('name'),
        ];
    }
}
